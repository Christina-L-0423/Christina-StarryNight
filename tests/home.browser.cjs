/* 无第三方测试依赖：本机 Edge（headless）+ Chrome DevTools Protocol，只断言 DOM 与 SN.store 公开数据。
   Windows: node tests/home.browser.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sn-home-test-'));
const edge = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
let browser, socket, server;
/* 修复控制台的 GBK 乱码：断言/日志一律用 ASCII 标记，中文只出现在页面内容里（不写终端） */
const say = label => console.log('PASS ' + label);
const fail = (label, detail) => new Error(label + ' :: ' + (detail === undefined ? '' : JSON.stringify(detail).replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16))));
const equal = (label, actual, expected) => { if (actual !== expected) throw fail(label, { actual, expected }); };
const ok = (label, cond, detail) => { if (!cond) throw fail(label, detail); };
const same = (label, actual, expected) => { try { assert.deepEqual(actual, expected); } catch { throw fail(label, { actual, expected }); } };
let seq = 0;
/* 应用面板有 0.32s 的进出过渡：固定等待容易偶发失败，改成轮询条件 */
async function until(label, expr, timeout = 4000) {
  const steps = Math.ceil(timeout / 50);
  for (let i = 0; i < steps; i += 1) {
    if (await evaluate(expr)) return;
    await wait(50);
  }
  throw fail(label, { timedOut: true });
}
async function openApp(id, params) {
  await evaluate('SN.store.openApp(' + JSON.stringify(id) + (params ? ', ' + JSON.stringify(params) : '') + ')');
  await until('app screen did not open: ' + id, `!!document.querySelector('.app-screen')`);
  await wait(300);
}
async function closeApp() {
  await evaluate('SN.store.closeApp()');
  await until('app screen did not close', `!document.querySelector('.app-screen')`);
  await wait(250);
}
const pending = new Map();
const errors = [];
function send(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 15000);
    pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function mouse(type, x, y) {
  await send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
}
/* 第 index 个「槽位」（4×6=24 格里的第 index 格）在屏幕上的坐标；被小组件盖住的格子返回 null */
async function cell(index) {
  return evaluate(`(() => { const track=document.querySelector('.home__track'); const m=new DOMMatrix(getComputedStyle(track).transform); const w=document.querySelector('.home__pager').getBoundingClientRect().width; const pg=Math.max(0,Math.round(-m.m41/w)); const el=document.querySelectorAll('.home__page')[pg].querySelector('[data-slot][data-index="${index}"]'); if(!el) return null; const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+25}; })()`);
}
async function dropIcon(from, to, press = 470) {
  const a = await cell(from);
  await mouse('mousePressed', a.x, a.y);
  await wait(press);
  const b = await cell(to);
  await mouse('mouseMoved', b.x, b.y);
  await mouse('mouseReleased', b.x, b.y);
  await wait(80);
}
/* 当前页的 24 个格子（按槽位号，不受小组件遮挡影响）：空位是 null，被小组件盖住的那几格也是 null */
async function slots() {
  return evaluate(`(() => { const track=document.querySelector('.home__track'); const m=new DOMMatrix(getComputedStyle(track).transform); const w=document.querySelector('.home__pager').getBoundingClientRect().width; const pg=Math.max(0,Math.round(-m.m41/w)); const grid=document.querySelectorAll('.home__page')[pg].querySelector('.home__grid'); const out=Array(24).fill(null); grid.querySelectorAll('[data-slot]').forEach(function(el){const l=el.querySelector('.app-icon__label'); out[Number(el.dataset.index)]=l?l.textContent.trim():null;}); return out; })()`);
}
/* 当前页（按 track 位移解析出的那一页）网格的矩形：页面可以不在 DOM 第一位，必须先算页号 */
async function gridRect() {
  return evaluate(`(() => { const track=document.querySelector('.home__track'); const m=new DOMMatrix(getComputedStyle(track).transform); const w=document.querySelector('.home__pager').getBoundingClientRect().width; const pg=Math.max(0,Math.round(-m.m41/w)); const r=document.querySelectorAll('.home__page')[pg].querySelector('.home__grid').getBoundingClientRect(); return {x:r.x, y:r.y, width:r.width, height:r.height, top:r.top, bottom:r.bottom}; })()`);
}
/* 小组件所在的页号 / 它占据的起始行号 */
const widgetAt = () => evaluate(`(() => { const s=SN.store.snapshot().settings.homeWidget||{}; return { page: s.page||0, row: typeof s.row==='number'?s.row:0 }; })()`);
async function boot() {
  const vendor = path.resolve(__dirname, 'vendor');
  server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (url.startsWith('/vendor/')) {
      fs.readFile(path.join(vendor, url.slice('/vendor/'.length)), (err, data) => {
        if (err) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Type', 'text/javascript');
        res.end(data);
      });
      return;
    }
    const rel = url === '/' ? '/index.html' : url;
    const file = path.resolve(root, '.' + decodeURIComponent(rel));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end(); return; }
      const type = ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream';
      res.setHeader('Content-Type', type);
      /* 用本地 Vue 顶掉 CDN：CDN 偶发 ERR_CONNECTION_CLOSED 会让整轮测试假失败（Vue is not defined） */
      if (type === 'text/html') {
        res.end(String(data).replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/vue@3\/dist\/vue\.global\.prod\.js/g, '/vendor/vue.global.prod.js'));
        return;
      }
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
  browser.on('error', err => errors.push(err.message));
  /* Edge 先建文件再写内容，直接读会撞上 EBUSY，所以重试到内容可用为止 */
  const portFile = path.join(profile, 'DevToolsActivePort');
  let port = '';
  for (let i = 0; i < 200; i++) {
    try {
      const text = fs.readFileSync(portFile, 'utf8').trim();
      if (/^\d+/.test(text)) { port = text.split('\n')[0].trim(); break; }
    } catch {}
    await wait(100);
  }
  assert.ok(port, 'Edge DevTools port published');
  const tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  socket.addEventListener('message', event => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error))); else p.resolve(msg.result);
    }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(JSON.stringify(msg.params.exceptionDetails));
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(msg.params.entry.text);
  });
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port });
  let ready = false;
  for (let i = 0; i < 400; i++) {
    ready = await evaluate(`!!document.querySelector('.home__cell')`);
    if (ready) break;
    await wait(100);
  }
  assert.ok(ready, 'Vue app booted: ' + JSON.stringify(await evaluate(`({cells:document.querySelectorAll('.home__cell').length, boot:(document.getElementById('boot')||{}).className||'', bootText:(document.getElementById('boot')||{}).textContent||'', body:document.body.innerHTML.slice(0,300)})`)) + ' errors=' + JSON.stringify(errors));
  await wait(150);
}

(async () => {
  await boot();
  ok('SN.store exposed', await evaluate('!!window.SN && !!SN.store'));
  /* 小组件开关（config.js → SN.homeWidgetEnabled）：关掉时桌面 24 格全给图标，
     下面所有和小组件有关的场景整体跳过，重新打开会自动继续跑。 */
  const widgetOn = await evaluate('SN.homeWidgetEnabled === true');
  say('home widget switch: ' + (widgetOn ? 'on (4x2 in the grid)' : 'off (config.js SN.homeWidgetEnabled = false)'));
  const expected = await evaluate('SN.apps.map(function(a){return a.name;})');
  same('every app rendered somewhere in the grid', (await slots()).filter(Boolean), expected);
  const size = await evaluate(`(() => { const gel=document.querySelector('.home__grid'); const g=gel.getBoundingClientRect(); const cs=getComputedStyle(gel); const rh=g.height/6; const pages=[...document.querySelectorAll('.home__page')]; const w=document.querySelector('.home__cell--widget'); const wt=w?w.querySelector('.widget'):null; const icons=[...pages[0].querySelectorAll('[data-slot]')]; const h=icons.map(el=>el.getBoundingClientRect().height); const bands=[...new Set(icons.map(function(el){return Math.round((el.getBoundingClientRect().top-g.top)/rh);}))]; const wbands=[...new Set([].concat.apply([],[...pages[0].querySelectorAll('.home__cell--widget,.home__cell--widget-ghost')].map(function(el){return [Math.round((el.getBoundingClientRect().top-g.top)/rh),Math.round((el.getBoundingClientRect().bottom-g.top)/rh)];})))]; return {grid:Math.round(g.height),row:Math.round(rh),min:Math.round(Math.min.apply(null,h)),iconCells:icons.length,cols:cs.gridTemplateColumns.split(' ').filter(Boolean).length,rows:cs.gridTemplateRows.split(' ').filter(Boolean).length,rowBands:bands.length,widgetBands:wbands.length,hasWidget:!!wt,widgetTop:wt?Math.round(wt.getBoundingClientRect().top-g.top):-1,gw:Math.round(g.width),ww:wt?Math.round(wt.getBoundingClientRect().width):-1,wh:wt?Math.round(wt.getBoundingClientRect().height):-1}; })()`);
  equal('grid is 4 columns wide', size.cols, 4);
  equal('grid has 6 rows (4 x 6 tracks = 24 slots)', size.rows, 6);
  ok('all six rows are usable and compact', size.grid >= 456 && size.min >= 60 && size.row >= 76, size);
  if (widgetOn) {
    equal('widget covers 4x2 = two whole rows', size.widgetBands, 2);
    equal('widget glass spans the full grid width (4 columns wide)', size.ww, size.gw);
    ok('widget glass fills both rows (a real 4x2 card, not content-sized)', Math.abs(size.wh - size.row * 2) <= 2, size);
    equal('the other four rows hold 4x4 = 16 icon cells', size.iconCells, 16);
    equal('icons span the four free row bands', size.rowBands, 4);
    ok('widget starts on a grid row', size.widgetTop % size.row <= 1, size);
    say('boot: 4x6 grid (24 slots, widget = 4x2), all apps rendered');
  } else {
    equal('widget off: no widget cell is rendered', size.hasWidget, false);
    equal('widget off: all 24 slots are icon cells', size.iconCells, 24);
    equal('widget off: icons span all six row bands', size.rowBands, 6);
    say('boot: 4x6 grid (24 slots, widget off in config.js), all apps rendered');
  }

  /* 会话列表：超长预览必须截断成一行，不能压到右边箭头上（用户上报的 bug）。 */
  const iconSlot = (await slots()).findIndex(Boolean);
  const chatIcon = await cell(iconSlot);
  await mouse('mousePressed', chatIcon.x, chatIcon.y);
  await mouse('mouseReleased', chatIcon.x, chatIcon.y);
  await wait(800);
  ok('chat app opened', await evaluate(`!!document.querySelector('.app-header')`));
  await evaluate(`(() => { SN.store.state.chats.christina = [{ role: 'them', text: '这是一条特别特别长的聊天记录'.repeat(8), ts: Date.now() }]; return 1; })()`);
  await wait(250);
  const preview = await evaluate(`(() => { const s=document.querySelector('.row__sub'); const c=document.querySelector('.row__chev'); if(!s||!c) return null; const sr=s.getBoundingClientRect(), cr=c.getBoundingClientRect(); return {len:s.textContent.length, display:getComputedStyle(s).display, gap:Math.round(cr.left-sr.right)}; })()`);
  ok('conversation list has a preview line', preview);
  equal('preview must be block-level (ellipsis needs a block)', preview.display, 'block');
  ok('preview truncated to 14 chars', preview.len <= 15, preview);
  ok('preview never overlaps the chevron', preview.gap > 0, preview);

  // 通栏 + 右上角时间：列表左右贴住屏幕边缘，行首行右侧显示 时:分。
  const rowExtra = await evaluate(`(() => { const t=document.querySelector('.row__time'); const f=document.querySelector('.list--flush'); const body=document.querySelector('.app-body'); if(!t||!f||!body) return null; const fr=f.getBoundingClientRect(), br=body.getBoundingClientRect(); return { time:t.textContent, timeOk:/^\\d{1,2}:\\d{2}$/.test(t.textContent), leftDelta:Math.round(fr.left-br.left), widthDelta:Math.round(br.width-fr.width) }; })()`);
  ok('conversation row has last-chat time and a flush container', rowExtra);
  ok('row shows HH:MM at the right', rowExtra.timeOk, rowExtra.time);
  ok('list is flush to both screen edges', Math.abs(rowExtra.leftDelta) <= 1 && Math.abs(rowExtra.widthDelta) <= 1, rowExtra);

  // 点开对话：微信式时间分割线（首条消息上方显示 时:分）。
  const rowRect = await evaluate(`(() => { const r=document.querySelector('.list--flush .row'); const b=r.getBoundingClientRect(); return {x:Math.round(b.left+b.width/2), y:Math.round(b.top+b.height/2)}; })()`);
  await mouse('mousePressed', rowRect.x, rowRect.y);
  await mouse('mouseReleased', rowRect.x, rowRect.y);
  await wait(400);
  const stamps = await evaluate(`(() => [...document.querySelectorAll('.chat__stamp')].map(function (e) { return e.textContent; }))()`);
  ok('conversation shows wechat-style time separators', stamps.length >= 1, stamps);
  ok('separator format is HH:MM', /^\d{1,2}:\d{2}$/.test(stamps[stamps.length - 1]), stamps[stamps.length - 1]);
  await closeApp();
  say('chat list: flush edges, row time, 14-char preview, time stamps');

  /* 聊天设置：角色聊天页右上角（和返回键同一排）的「···」→ 这个角色专属的设置页，
     里面只有一件事：上下文记忆轮数（拉条 + 右边的数字，两边都能改，默认 100 轮 / 上限 500 轮）。 */
  await openApp('chat');
  equal('the conversation list has no header action button', await evaluate(`document.querySelectorAll('.app-header .header-btn').length`), 0);
  await evaluate(`[...document.querySelectorAll('.list--flush .row')].filter(function(r){return r.textContent.indexOf('Christina')!==-1;})[0].click()`);
  await until('chat page opened', `!!document.querySelector('.chat__list')`);
  await wait(300);

  const dots = await evaluate(`(() => { const b=document.querySelector('.app-header .header-btn'); const t=document.querySelector('.app-header__title'); const bar=document.querySelector('.app-header__bar'); if(!b||!t||!bar) return null; const br=b.getBoundingClientRect(), tr=t.getBoundingClientRect(), hb=bar.getBoundingClientRect(); return { label:b.getAttribute('aria-label'), title:t.textContent.trim(), glyph:!!b.querySelector('svg.glyph'), sameRow:Math.abs((br.top+br.height/2)-(tr.top+tr.height/2))<=2, rightGap:Math.round(hb.right-br.right) }; })()`);
  ok('the character chat page has a header action button', dots, 'no .app-header .header-btn');
  equal('the header action is the chat-settings entry', dots.label, '聊天设置');
  ok('the header action draws a glyph (three dots)', dots.glyph, dots);
  ok('the header action sits in the same row as the exit key', dots.sameRow, dots);
  ok('the header action is pinned to the right edge of the header', dots.rightGap <= 22, dots);
  equal('the chat title is still the character name', dots.title, 'Christina');
  say('chat settings: the character chat page carries a right-aligned ... entry');

  await evaluate(`document.querySelector('.app-header .header-btn').click()`);
  await until('chat settings page opened', `!!document.querySelector('.chat-settings')`);
  await wait(200);
  const settingsUi = await evaluate(`(() => { const s=document.querySelector('.chat-settings'); if(!s) return null; const r=s.querySelector('input.range'); const n=s.querySelector('.range-num'); return { title:document.querySelector('.app-header__title').textContent.trim(), dots:document.querySelectorAll('.app-header .header-btn').length, composer:document.querySelectorAll('.composer').length, min:r?r.getAttribute('min'):'', max:r?r.getAttribute('max'):'', value:r?Number(r.value):-1, num:n?n.textContent.replace(/[^0-9]/g,''):'', stored:Object.keys(JSON.parse(JSON.stringify(SN.store.state.chatSettings||{}))).length, text:s.textContent.replace(/\\s+/g,' ') }; })()`);
  ok('the three dots opens the chat-settings page', settingsUi, 'no .chat-settings');
  equal('the settings page is titled 聊天设置', settingsUi.title, '聊天设置');
  equal('the dots entry folds away on the settings page itself', settingsUi.dots, 0);
  equal('the chat composer is not part of the settings page', settingsUi.composer, 0);
  equal('the memory slider min is 1 round', settingsUi.min, '1');
  equal('the memory slider max is 500 rounds', settingsUi.max, '500');
  equal('memory rounds default to 100', settingsUi.value, 100);
  equal('the number at the right of the slider reads 100', settingsUi.num, '100');
  equal('nothing is stored until the user changes it', settingsUi.stored, 0);
  ok('the page explains what a round is', settingsUi.text.indexOf('1 轮 = 你 1 条 + AI 1 条') !== -1, settingsUi.text);

  /* 记忆轮数的读写逻辑（logic/prompt.js 的 SN.logic.context）：默认值 + 夹在 1 ~ 500 */
  equal('a character without its own setting uses the default', await evaluate(`SN.logic.context.rounds('zz_nobody')`), 100);
  equal('the clamp keeps values inside 1 ~ 500', await evaluate(`[SN.logic.context.clamp(-5), SN.logic.context.clamp(0), SN.logic.context.clamp(9999), SN.logic.context.clamp('')].join(',')`), '1,1,500,100');
  say('chat settings: 1 ~ 500 rounds, default 100, nothing stored until changed');

  /* 拉条：headless 里原生滑块跟着「触摸拖动」走（移动端模拟下，第一下合成鼠标按下只会激活页面，
     不会落到滑块上，所以这里用触摸事件模拟手指），从 25% 拖到 60%。 */
  const sliderBox = await evaluate(`(() => { const r=document.querySelector('.chat-settings input.range'); const b=r.getBoundingClientRect(); return { left:b.left, width:b.width, y:b.top+b.height/2 }; })()`);
  ok('the memory slider is a wide bar (not the 118px mini slider)', sliderBox.width > 180, sliderBox);
  const sliderValue = () => evaluate(`Number(document.querySelector('.chat-settings input.range').value)`);
  const dragX = [0.25, 0.42, 0.6].map(function (fraction) { return sliderBox.left + sliderBox.width * fraction; });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: dragX[0], y: sliderBox.y, id: 1 }] });
  await wait(90);
  const started = await sliderValue();
  await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: dragX[1], y: sliderBox.y, id: 1 }] });
  await wait(90);
  const midDrag = await sliderValue();
  await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: dragX[2], y: sliderBox.y, id: 1 }] });
  await wait(90);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await wait(220);
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  const dragged = await sliderValue();
  ok('the memory slider jumps to where the finger lands (~25% of the track)', Math.abs(started - 125) < 45, started);
  ok('the memory slider follows the finger while dragging', midDrag > started + 30, { started: started, midDrag: midDrag });
  ok('the memory slider settles around 60% of the track', Math.abs(dragged - 300) < 50, dragged);
  equal('dragging the slider stores the per-character rounds', await evaluate(`SN.store.state.chatSettings.christina.contextRounds`), dragged);
  equal('the number follows the slider', await evaluate(`Number(document.querySelector('.chat-settings .range-num').textContent.replace(/[^0-9]/g,''))`), dragged);
  say('chat settings: the memory slider drags and stores per character');

  /* 数字：点一下变成输入框 → 手输 137 → 拉条跟着走 */
  await evaluate(`document.querySelector('.chat-settings .range-num').click()`);
  await until('the number turned into an input', `!!document.querySelector('.chat-settings .range-num-input')`);
  await wait(150);
  const numField = await evaluate(`(() => { const i=document.querySelector('.chat-settings .range-num-input'); return { type:i.type, focused:document.activeElement===i, limits:i.getAttribute('min')+'-'+i.getAttribute('max') }; })()`);
  equal('the number becomes a number field', numField.type, 'number');
  ok('the field opens focused, so typing replaces the value', numField.focused, numField);
  equal('the field carries the same 1 ~ 500 limits', numField.limits, '1-500');
  await evaluate(`(() => { const i=document.querySelector('.chat-settings .range-num-input'); i.value='137'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true})); return 1; })()`);
  await wait(250);
  equal('a custom round count typed by hand is stored', await evaluate(`SN.store.state.chatSettings.christina.contextRounds`), 137);
  equal('the slider jumps to the typed value', await evaluate(`Number(document.querySelector('.chat-settings input.range').value)`), 137);
  equal('the number shows the typed value again', await evaluate(`document.querySelector('.chat-settings .range-num').textContent.replace(/[^0-9]/g,'')`), '137');

  async function typeRounds(text) {
    await evaluate(`document.querySelector('.chat-settings .range-num').click()`);
    await until('the number turned into an input', `!!document.querySelector('.chat-settings .range-num-input')`);
    await evaluate(`(() => { const i=document.querySelector('.chat-settings .range-num-input'); i.value=${JSON.stringify(text)}; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',bubbles:true})); return 1; })()`);
    await wait(220);
    return evaluate(`SN.store.state.chatSettings.christina.contextRounds`);
  }
  equal('typing above the ceiling clamps to 500 rounds', await typeRounds('9999'), 500);
  equal('typing below the floor clamps to 1 round', await typeRounds('0'), 1);
  equal('an empty input keeps the previous value', await typeRounds(''), 1);
  await evaluate(`[...document.querySelectorAll('.chat-settings .btn')][0].click()`);
  await wait(250);
  equal('the reset button puts it back to the default 100 rounds', await evaluate(`SN.store.state.chatSettings.christina.contextRounds`), 100);
  say('chat settings: the number can be typed by hand (1 ~ 500, back to default)');

  /* 轮数真的影响请求：20 轮历史 + 一条待回复的消息，设成 3 轮 →
     1 条系统提示词 + 6 条历史（最近 3 轮）；记忆留在系统提示词里，本条用户消息压尾。 */
  await evaluate(`(() => { const list=[]; for (let i=0;i<20;i+=1) { list.push({role:'me',text:'我'+i,ts:Date.now()}); list.push({role:'them',text:'你'+i,ts:Date.now()}); } SN.store.state.chats.christina=list; SN.store.state.memoryBank=[{id:'mem_test',text:'用户住在杭州',keywords:['杭州'],pinned:true,enabled:true}]; return list.length; })()`);
  await evaluate(`SN.logic.context.setRounds('christina', 3)`);
  await wait(200);
  await evaluate(`SN.store.pushMessage('christina','me','这条还在等回复')`);
  await wait(250);
  const request = await evaluate(`(() => { const ms=SN.api.buildMessages('christina'); return { total:ms.length, roles:ms.map(function(m){return m.role;}).join(','), first:ms[1].content, last:ms[ms.length-1].content, memoryInSystem:ms[0].content.indexOf('用户住在杭州')!==-1, memoryInHistory:ms.slice(1).some(function(m){return String(m.content).indexOf('用户住在杭州')!==-1;}) }; })()`);
  equal('3 rounds = 6 history messages after the system prompt', request.total, 7);
  equal('the history sits between the memory prompt and the current user message', request.roles, 'system,assistant,user,assistant,user,assistant,user');
  equal('only the newest rounds are carried', request.first, '你17');
  equal('the current user message goes last', request.last, '这条还在等回复');
  ok('memory stays inside the system prompt (before the history)', request.memoryInSystem);
  equal('memory is never repeated as a chat message', request.memoryInHistory, false);
  say('chat settings: 3 rounds -> 6 history messages, memory first, current message last');

  /* 每个角色各存各的 + 随 localStorage / 备份走；旧的全局「携带最近聊天」已经下线 */
  await wait(450);
  const persisted = await evaluate(`(() => { const s=SN.store.snapshot(); const raw=JSON.parse(localStorage.getItem('starrynight.state.v1')||'{}'); return { snap:s.chatSettings, disk:raw.chatSettings, legacy:Object.prototype.hasOwnProperty.call(s.settings.api||{},'contextCount') }; })()`);
  equal('per-character rounds land in the snapshot', persisted.snap.christina.contextRounds, 3);
  equal('per-character rounds land in localStorage', persisted.disk.christina.contextRounds, 3);
  equal('the old global context slider is retired from the data', persisted.legacy, false);
  say('chat settings: rounds survive in the snapshot + localStorage, old global slider retired');

  /* 返回键：设置页 → 聊天页 →（再按一次）会话列表；「···」只在聊天页出现 */
  await evaluate(`document.querySelector('.back-btn').click()`);
  await wait(400);
  ok('the settings back key returns to the chat itself', await evaluate(`!!document.querySelector('.chat__list') && !document.querySelector('.chat-settings')`));
  ok('the dots entry is back on the chat page', await evaluate(`!!document.querySelector('.app-header .header-btn')`));
  equal('the title is the character name again', await evaluate(`document.querySelector('.app-header__title').textContent.trim()`), 'Christina');
  await evaluate(`document.querySelector('.back-btn').click()`);
  await wait(400);
  ok('the next back key leaves the chat for the conversation list', await evaluate(`!!document.querySelector('.list--flush .row') && document.querySelectorAll('.app-header .header-btn').length === 0`));
  await closeApp();
  say('chat settings: back key walks settings -> chat -> list');

  /* 设置 → API：旧的全局「携带最近聊天」滑块退休，只留一行指路文字（记忆改成按角色设置） */
  await openApp('settings');
  await evaluate(`document.querySelectorAll('.list .row')[0].click()`);
  await wait(450);
  const apiPage = await evaluate(`(() => { const body=document.querySelector('.app-body'); return { title:document.querySelector('.app-header__title').textContent.trim(), sliders:body.querySelectorAll('input[type=range]').length, legacy:body.textContent.indexOf('携带最近聊天')!==-1, pointer:body.textContent.indexOf('聊天页右上角')!==-1 && body.textContent.indexOf('100 轮')!==-1 }; })()`);
  equal('the API subpage still opens', apiPage.title, 'API');
  equal('the API page no longer offers the global history slider', apiPage.legacy, false);
  equal('the API page keeps only temperature + length sliders', apiPage.sliders, 2);
  equal('the API page points at the per-character chat settings', apiPage.pointer, true);
  await closeApp();
  say('settings/API: global history slider retired, a pointer to chat settings remains');

  // 角色集：竖向居中角色卡 + 简介；角色编辑有「简介」字段；简介不进提示词。
  const promptSrc = fs.readFileSync(path.join(root, 'assets/js/logic/prompt.js'), 'utf8');
  ok('prompt.js never reads intro (简介不发 AI)', !/\bintro\b/.test(promptSrc));
  await openApp('characters');
  const charUi = await evaluate(`(() => { const l=document.querySelector('.char-list'); const c=document.querySelector('.char-card'); const i=document.querySelector('.char-card__intro'); if(!l||!c||!i) return null; return { dir:getComputedStyle(l).flexDirection, name:c.querySelector('.char-card__name').textContent, introLen:i.textContent.length }; })()`);
  ok('characters view renders cards', charUi);
  equal('character cards stack vertically', charUi.dir, 'column');
  ok('card shows the intro', charUi.introLen > 0, charUi);
  await openApp('characterEdit', { characterId: 'christina' });
  const editUi = await evaluate(`(() => { const labels=[...document.querySelectorAll('.field__label')].map(e=>e.textContent); const areas=[...document.querySelectorAll('.input--area')]; return { labels:labels, firstAreaDisabled: areas.length ? areas[0].disabled : null }; })()`);
  ok('character edit has an intro field', editUi.labels.indexOf('简介') !== -1, editUi.labels);
  equal('official (locked) character intro is read-only', editUi.firstAreaDisabled, true);
  await closeApp();
  say('characters view: vertical centered cards + intro field, intro never sent to AI');

  // 聊天列表搜索栏：按角色名里的字筛选，清空后恢复全部会话。
  await evaluate(`SN.store.state.characters.push({ id:'zz_extra', name:'柚子茶', persona:'测试用', greeting:'在的', intro:'测试角色' })`);
  await openApp('chat');
  const searchBar = await evaluate(`(() => { const b=document.querySelector('.chat-search'); const i=b&&b.querySelector('input'); return b&&i?{ph:i.placeholder}:null; })()`);
  ok('chat list has a search bar above the conversations', searchBar);
  const rowsAll = await evaluate(`document.querySelectorAll('.list--flush .row').length`);
  ok('empty search lists every conversation', rowsAll >= 2, rowsAll);
  await evaluate(`(() => { const i=document.querySelector('.chat-search input'); i.value='柚子'; i.dispatchEvent(new Event('input',{bubbles:true})); return 1; })()`);
  await wait(300);
  const found = await evaluate(`[...document.querySelectorAll('.list--flush .row .row__label')].map(function(e){return e.textContent;})`);
  equal('search shows only the matching conversation', found.length, 1);
  ok('match is the character whose name contains the query', found[0].indexOf('柚子') !== -1, found);
  await evaluate(`(() => { const i=document.querySelector('.chat-search input'); i.value=''; i.dispatchEvent(new Event('input',{bubbles:true})); return 1; })()`);
  await wait(300);
  equal('clearing the query restores every conversation', await evaluate(`document.querySelectorAll('.list--flush .row').length`), rowsAll);
  say('chat search filters by character name and restores when empty');

  // 用户：面具列表 → 点进编辑页 → 保存前不生效 / 保存后生效 / 应用此面具换 AI 看到的用户设定。
  await closeApp();
  await wait(400);
  await openApp('profile');
  const maskList = await evaluate(`(() => { const l=document.querySelector('.char-list'); const cards=[...document.querySelectorAll('.char-card')]; return { dir:l?getComputedStyle(l).flexDirection:'', count:cards.length, hasBadge:!!document.querySelector('.badge--on') }; })()`);
  ok('user page lists mask cards', maskList.count >= 1, maskList);
  equal('mask cards stack vertically (same as characters)', maskList.dir, 'column');
  ok('the applied mask carries the in-use badge', maskList.hasBadge);

  await evaluate(`document.querySelector('.char-card').click()`);
  await wait(400);
  const maskEdit = await evaluate(`(() => { const labels=[...document.querySelectorAll('.field__label')].map(e=>e.textContent); const btns=[...document.querySelectorAll('.btn')].map(e=>e.textContent.trim()); return { labels:labels, btns:btns }; })()`);
  ok('mask editor has name + user persona fields', maskEdit.labels.indexOf('面具名字') !== -1 && maskEdit.labels.indexOf('用户设定') !== -1, maskEdit.labels);
  ok('mask editor has a Save button at the bottom', maskEdit.btns.indexOf('保存') !== -1, maskEdit.btns);
  ok('mask editor has an Apply-this-mask button', maskEdit.btns.indexOf('应用此面具') !== -1, maskEdit.btns);

  const originalName = await evaluate(`SN.store.snapshot().masks[0].name`);
  await evaluate(`(() => { const i=document.querySelector('input.input'); i.value='未保存的名字'; i.dispatchEvent(new Event('input',{bubbles:true})); return 1; })()`);
  await wait(200);
  equal('unsaved draft never touches the data', await evaluate(`SN.store.snapshot().masks[0].name`), originalName);
  await evaluate(`document.querySelector('.back-btn').click()`);
  await wait(400);
  ok('back button returns to the mask list', await evaluate(`!!document.querySelector('.char-list')`));
  equal('unsaved edits are discarded on exit', await evaluate(`SN.store.snapshot().masks[0].name`), originalName);

  await evaluate(`[...document.querySelectorAll('.btn')].filter(function(b){return b.textContent.indexOf('新建面具')!==-1;})[0].click()`);
  await wait(300);
  await evaluate(`(() => { const i=document.querySelector('input.input'); i.value='星旅人'; i.dispatchEvent(new Event('input',{bubbles:true})); const t=document.querySelector('textarea.input'); t.value='一个爱看星星的人'; t.dispatchEvent(new Event('input',{bubbles:true})); return 1; })()`);
  await wait(200);
  await evaluate(`[...document.querySelectorAll('.btn')].filter(function(b){return b.textContent.trim()==='保存';})[0].click()`);
  await wait(350);
  const masksNow = await evaluate(`SN.store.snapshot().masks.map(function(m){return m.name;})`);
  ok('saved mask joins the list', masksNow.indexOf('星旅人') !== -1, masksNow);

  await evaluate(`SN.store.state.activeMaskId = SN.store.state.masks.filter(function(m){return m.name==='星旅人';})[0].id`);
  await wait(200);
  const prompt = await evaluate(`SN.api.buildMessages('christina').map(function(m){return m.content;}).join('\\n')`);
  ok('prompt carries a user-persona section', prompt.indexOf('【用户设定】') !== -1);
  ok('prompt uses the applied mask name', prompt.indexOf('星旅人') !== -1);
  ok('prompt carries the applied mask persona', prompt.indexOf('一个爱看星星的人') !== -1);
  say('masks: list -> editor (save/discard) + apply swaps the user identity in the prompt');

  // 统计：从「用户」页搬进了设置里单独一排。
  await closeApp();
  await openApp('settings');
  const statRows = await evaluate(`[...document.querySelectorAll('.row')].filter(function(x){return x.textContent.indexOf('统计')!==-1;}).length`);
  equal('settings list has exactly one Stats row', statRows, 1);
  await evaluate(`[...document.querySelectorAll('.row')].filter(function(x){return x.textContent.indexOf('统计')!==-1;})[0].click()`);
  await wait(450);
  const statPage = await evaluate(`(() => { const t=document.querySelector('.app-header__title'); return { title:t?t.textContent.trim():'', body:document.querySelector('.app-body')?document.querySelector('.app-body').textContent.length:0 }; })()`);
  equal('stats subpage title', statPage.title, '统计');
  ok('stats subpage has content', statPage.body > 20, statPage);
  await closeApp();
  say('stats moved into settings as its own row');

  /* 美化 →「我的壁纸」缩略图：自定义壁纸是压缩后仍有 1600px 的大图，
     缩略图必须 cover 居中铺满，否则只会露出左上角一小块（用户上报的 bug）。 */
  await evaluate(`(function () { const c=document.createElement('canvas'); c.width=900; c.height=1600; const x=c.getContext('2d'); x.fillStyle='#e8483f'; x.fillRect(0,0,900,1600); SN.store.addCustomWallpaper('测试图', c.toDataURL('image/jpeg', 0.9)); return 1; })()`);
  await openApp('beautify');
  const thumb = await evaluate(`(function () { const it=document.querySelector('.wallpaper-pick__item.is-custom'); if (!it) return null; const cs=getComputedStyle(it); const r=it.getBoundingClientRect(); return { size:cs.backgroundSize, pos:cs.backgroundPosition, rep:cs.backgroundRepeat, w:Math.round(r.width), h:Math.round(r.height), ratio:Math.round((r.width/r.height)*1000)/1000, name:(it.querySelector('.wallpaper-pick__name')||{}).textContent, del:!!it.querySelector('.wallpaper-pick__del') }; })()`);
  ok('beautify lists a custom wallpaper thumbnail', thumb, 'no .wallpaper-pick__item.is-custom');
  equal('thumbnail scales the whole image (background-size: cover)', thumb.size, 'cover');
  equal('thumbnail is centred on the image', thumb.pos, '50% 50%');
  equal('thumbnail does not tile the image', thumb.rep, 'no-repeat');
  ok('thumbnail keeps the 9:16 wallpaper ratio', Math.abs(thumb.ratio - 0.5625) <= 0.03, thumb);
  equal('thumbnail shows the wallpaper name', thumb.name, '测试图');
  ok('thumbnail has its delete button', thumb.del);
  await evaluate(`SN.store.removeCustomWallpaper(SN.store.state.customWallpapers[SN.store.state.customWallpapers.length-1].id)`);
  await closeApp();
  say('beautify: my-wallpaper thumbnails fit the whole image (cover + centred, 9:16)');

  /* 状态栏电量：优先读本机真实电量（Battery Status API，见 store.js），读不到才用
     「美化 → 状态栏电量」里的手动值。headless Edge 里这个接口可能秒回、也可能被拒绝，
     两种世界都得能过：读得到就按设备实际电量断言，读不到就按手动值断言。
     下面把两条路都演一遍（关开关 / 拖拉条 / 再打开开关）。 */
  const apiPresent = await evaluate(`typeof navigator.getBattery === 'function'`);
  /* 读不到本机电量时状态栏该显示什么：settings.battery 设过就用它，
     没设过用 config.js 的 SN.batteryFallback（和 store.js 里的规则一致） */
  const manualLevel = () => evaluate(`(function () { const s = SN.store.state.settings; return (s.battery === null || s.battery === undefined || s.battery === '') ? SN.batteryFallback : Math.round(Number(s.battery)); })()`);
  const batteryNow = () => evaluate(`(function () { const b=SN.store.battery.value; const el=document.querySelector('.status-bar .battery'); const fill=el?el.querySelectorAll('svg.glyph rect')[1]:null; return { level:b.level, charging:b.charging, real:b.real, glyph:!!el, hasBolt:el?!!el.querySelector('.battery__bolt'):false, chargingClass:el?el.classList.contains('is-charging'):false, fill:fill?Number(fill.getAttribute('width')):-1, fillColor:fill?fill.getAttribute('fill'):'' }; })()`);
  const stored = key => evaluate(`(JSON.parse(localStorage.getItem('starrynight.state.v1')||'{}').settings||{}).${key}`);
  /* 等接口回话（接口不可用就没有这一步），最多 2 秒 */
  if (apiPresent) {
    for (let i = 0; i < 40; i += 1) {
      if (await evaluate('SN.store.battery.value.real')) break;
      await wait(50);
    }
  }
  const batt = await batteryNow();
  const fallback = await evaluate('SN.batteryFallback');
  ok('config.js exposes a sane fallback level', typeof fallback === 'number' && fallback >= 0 && fallback <= 100, fallback);
  ok('status bar draws the battery glyph', batt.glyph, 'no .status-bar .battery');
  ok('battery fill width tracks the level', Math.abs(batt.fill - Math.max(2.2, (12.8 * batt.level) / 100)) < 0.2, batt);
  equal('charging bolt shows only while charging', batt.hasBolt, batt.charging && batt.real);
  equal('charging class mirrors the bolt', batt.chargingClass, batt.charging && batt.real);
  if (batt.charging && batt.real) equal('charging fill turns green', batt.fillColor, 'var(--green)');
  else equal('idle fill keeps the status-bar colour', batt.fillColor, 'currentColor');
  if (apiPresent && batt.real) {
    const device = await evaluate(`navigator.getBattery().then(function (b) { return { level: Math.round(b.level * 100), charging: !!b.charging }; })`);
    equal('the level is the device battery level', batt.level, device.level);
    equal('the charging flag is the device one', batt.charging, device.charging);
    say('status bar reads the real device battery (level ' + batt.level + '%, charging ' + batt.charging + ')');
  } else {
    equal('no usable device reading -> the manual level', batt.level, await manualLevel());
    equal('the manual level is not marked as a real reading', batt.real, false);
    say('Battery Status API unusable here -> the bar shows the manual level');
  }

  /* 「美化 → 状态栏电量」：一条「读取本机电量」开关 + 一条手动拉条。
     读不到本机电量的浏览器（Safari / 部分 Firefox / 用局域网 http 地址打开）里，
     手动值就是状态栏唯一能用的来源，所以两条都必须真的管用。 */
  await openApp('beautify');
  const batteryUi = () => evaluate(`(function () {
    const screen = document.querySelector('.app-screen');
    const rows = [...screen.querySelectorAll('.row')];
    const readRow = rows.filter(function (r) { return r.textContent.indexOf('读取本机电量') !== -1; })[0] || null;
    const sliderRow = rows.filter(function (r) { return !!r.querySelector('input.range'); })[0] || null;
    const range = sliderRow ? sliderRow.querySelector('input.range') : null;
    const sw = readRow ? readRow.querySelector('.switch') : null;
    return {
      batteryRows: rows.filter(function (r) { return r.textContent.indexOf('电量') !== -1; }).length,
      hasSwitch: !!sw,
      switchOn: sw ? sw.classList.contains('is-on') : null,
      hint: readRow ? readRow.querySelector('.row__sub').textContent.trim() : '',
      hasRange: !!range,
      value: range ? Number(range.value) : null,
      disabled: range ? !!range.disabled : null,
      label: sliderRow ? sliderRow.querySelector('.row__label').textContent.trim() : ''
    };
  })()`);
  const tapBatterySwitch = () => evaluate(`(function () { const rows = [...document.querySelectorAll('.app-screen .row')]; const row = rows.filter(function (r) { return r.textContent.indexOf('读取本机电量') !== -1; })[0]; row.querySelector('.switch').click(); })()`);
  let ui = await batteryUi();
  ok('beautify lists the battery rows again', ui.batteryRows >= 1, ui);
  ok('the battery switch is there', ui.hasSwitch, ui);
  ok('the manual battery slider is there', ui.hasRange, ui);
  equal('the switch is on by default (read the device level)', ui.switchOn, true);
  ok('the device reading is marked as real in the store', await evaluate(`SN.store.battery.value.real === ${apiPresent && batt.real}`), ui.hint);
  if (apiPresent && batt.real) {
    equal('the slider is locked while the device level drives the bar', ui.disabled, true);
    ok('the hint shows the device reading', ui.hint.indexOf('已读到本机电量') !== -1, ui.hint);
  } else {
    equal('the slider stays usable when the device level cannot be read', ui.disabled, false);
    ok('the hint says why the level is not readable', ui.hint.length > 0 && ui.hint.indexOf('已读到本机电量') === -1, ui.hint);
  }

  /* 关掉「读取本机电量」→ 状态栏立刻改用手动值（没有小闪电），并写进设置 */
  await tapBatterySwitch();
  await wait(450);
  const manualNow = await manualLevel();
  const off = await batteryNow();
  equal('switching off hands the bar over to the manual level', off.level, manualNow);
  equal('switching off drops the charging bolt', off.hasBolt, false);
  equal('the switch state is saved', await stored('batteryReal'), false);
  ui = await batteryUi();
  equal('the slider is enabled now', ui.disabled, false);
  equal('the slider shows the level in use', ui.value, manualNow);
  ok('the hint says the switch is off', ui.hint.indexOf('关闭') !== -1, ui.hint);
  equal('the fill keeps the status-bar colour', off.fillColor, 'currentColor');
  say('beautify: the manual level takes over once the device reading is switched off');

  /* 拖那条拉条 → 状态栏跟着变，值存进 settings.battery（读不到电量时全靠它） */
  await evaluate(`(function () { const r = document.querySelector('.app-screen input.range'); r.value = '42'; r.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await wait(450);
  const slideBatt = await batteryNow();
  equal('dragging the slider moves the bar', slideBatt.level, 42);
  ok('the fill width follows the slider', Math.abs(slideBatt.fill - Math.max(2.2, (12.8 * 42) / 100)) < 0.2, slideBatt);
  equal('the manual level is saved', await stored('battery'), 42);
  ui = await batteryUi();
  ok('the slider label says the level is manual', ui.label.indexOf('手动') !== -1, ui.label);
  say('beautify: the manual battery slider drives the bar and is saved (' + slideBatt.level + '%)');

  /* 再打开开关：读得到就回到本机读数，读不到就继续用手动值 */
  await tapBatterySwitch();
  await wait(450);
  const back = await batteryNow();
  equal('the switch state is saved again', await stored('batteryReal'), true);
  if (apiPresent) equal('turning it back on returns the device reading', back.real, true);
  else equal('still no device reading -> the manual level stays', back.level, 42);
  await closeApp();
  say('battery: the device level wins when it is readable, the manual level is the fallback');

  /* 第一个有图标的格子：小组件开着时是被它挤下来的第 8 格（第 3 行），关掉时就是第 0 格 —— 两种都测 */
  await evaluate(`document.querySelectorAll('.home__dot')[0].click()`);
  await wait(450);
  const occupied = (await slots()).findIndex(Boolean);
  const destSlot = 23;
  const first = (await slots())[occupied];
  const firstId = await evaluate(`SN.apps.filter(function (a) { return a.name === ${JSON.stringify(first)}; })[0].id`);
  ok('the first occupied slot holds an icon', first, occupied);
  equal('and that icon is the first app in the list', firstId, await evaluate('SN.apps[0].id'));
  await dropIcon(occupied, destSlot);
  let now = await slots();
  equal('source slot is now empty', now[occupied], null);
  equal('icon landed in slot 23', now[destSlot], first);
  const saved = await evaluate('SN.store.snapshot().settings.homeLayout');
  equal('empty slot persisted', saved[0][occupied], null);
  equal('dropped slot persisted', saved[0][destSlot], firstId);
  /* 布局里不能出现重复图标（小组件压住图标时旧代码只搬不腾空，会留下同一个 id 的两份） */
  equal('layout has no duplicated icons', new Set(saved[0].filter(Boolean)).size, saved[0].filter(Boolean).length);
  const empty = await evaluate(`(() => { const s=SN.store.snapshot().settings.homeLayout[0]; return s.filter(function (x) { return !x; }).length; })()`);
  ok('empty slots stay empty in a 24-slot page', empty >= 16, empty);
  await evaluate('SN.store.applySnapshot(JSON.parse(JSON.stringify(SN.store.snapshot())))');
  equal('placement survives a backup round trip', (await slots())[23], first);
  say('free placement keeps empty slots + backup round trip');

  // 右边缘：按住最后一行的图标拖到右缘 → 自动新建一页并把图标带过去。
  const edgeR = await evaluate(`(() => {const r=document.querySelector('.home__pager').getBoundingClientRect(); return {x:r.right-8,y:r.top+60};})()`);
  const fromR = await cell(23);
  await mouse('mousePressed', fromR.x, fromR.y);
  await wait(470);
  await mouse('mouseMoved', edgeR.x, edgeR.y);
  await wait(700);
  equal('right edge created a second page', await evaluate(`document.querySelectorAll('.home__page').length`), 2);
  await wait(400);
  await mouse('mouseReleased', edgeR.x, edgeR.y);
  await wait(150);
  now = await slots();
  equal('icon moved onto the new page', now[3], first);
  equal('old page is left with a single icon', now.filter(Boolean).length, 1);
  say('right edge auto-creates a page and carries the icon');

  // 点页点回到第一页，再测左边缘的前方插页。
  await evaluate(`document.querySelectorAll('.home__dot')[0].click()`);
  await wait(450);

  /* 空白处也能开始滑动：找一个「左半边」的空格起步，保证 +100px 的滑动终点还留在屏幕里
   （393px 的窗口里，最右列 x+100 会落出视口，pointermove 根本不会派发）。 */
  const arr = await slots();
  let blankIndex = -1;
  for (let i = 8; i < 24; i += 1) { if (arr[i] === null && i % 4 <= 1) { blankIndex = i; break; } }
  if (blankIndex < 0) blankIndex = arr.lastIndexOf(null);
  const blank = await cell(blankIndex);
  ok('found an empty cell to start the swipe from', blank, blankIndex);
  await mouse('mousePressed', blank.x, blank.y);
  await mouse('mouseMoved', blank.x + 100, blank.y);
  await wait(80);
  const follow = await evaluate(`(() => { const t=document.querySelector('.home__track'); return {m41:new DOMMatrix(getComputedStyle(t).transform).m41, d:getComputedStyle(t).transitionDuration}; })()`);
  equal('no transition while following the finger', follow.d, '0s');
  ok('page follows the finger', Math.abs(follow.m41) > 10, follow);
  await mouse('mouseReleased', blank.x + 100, blank.y);
  await wait(90);
  const during = await evaluate(`new DOMMatrix(getComputedStyle(document.querySelector('.home__track')).transform).m41`);
  ok('slide passes an intermediate frame (not a jump cut)', Math.abs(during) > 1 && Math.abs(during) < 340, during);
  await wait(500);
  equal('slide settles on the page grid', Math.round(await evaluate(`new DOMMatrix(getComputedStyle(document.querySelector('.home__track')).transform).m41`)), 0);
  say('finger-following swipe with smooth slide animation');

  const iconLabel = (await slots()).find(x => x);
  const from = await cell((await slots()).indexOf(iconLabel));
  const edgeL = await evaluate(`(() => {const r=document.querySelector('.home__pager').getBoundingClientRect(); return {x:r.left+8,y:r.top+60};})()`);
  await mouse('mousePressed', from.x, from.y);
  await wait(470);
  await mouse('mouseMoved', edgeL.x, edgeL.y);
  await wait(700);
  equal('left edge inserted a third page', await evaluate(`document.querySelectorAll('.home__page').length`), 3);
  await wait(400);
  await mouse('mouseReleased', edgeL.x, edgeL.y);
  await wait(400);
  equal('icon landed in the new leading page', (await slots())[0], iconLabel);
  say('left edge inserts a page before the current one');

  if (!widgetOn) say('widget scenarios skipped: the widget is switched off in config.js');
  /* 小组件：和图标一样住在网格里 —— 可以停在任意一行（不再只有最上或最下），拖到边缘跟着换页，位置随备份走。
     （下面这一大段整体受 widgetOn 控制：关掉小组件时跳过；块内不再额外缩进，方便整段开关。） */
  if (widgetOn) {
  const widgetCenter = () => evaluate(`(() => { const w=document.querySelector('.home__cell--widget .widget'); if(!w) return null; const r=w.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  let wpos = await widgetAt();
  await evaluate(`document.querySelectorAll('.home__dot')[${wpos.page}].click()`);
  await wait(450);
  /* 小组件住在自己那一页的网格里（grid-row: span 2 一格占两行）；其他页是完整的 24 格，不用让行 */
  equal('the widget lives in its page grid (exactly one widget cell)', await evaluate(`document.querySelectorAll('.home__cell--widget').length`), 1);
  equal('other pages keep all 24 slots', await evaluate(`(function(){ const pages=[...document.querySelectorAll('.home__page')]; const wi=pages.findIndex(function(p){return p.querySelector('.home__cell--widget');}); return pages.filter(function(p,i){return i!==wi;}).every(function(p){return p.querySelectorAll('[data-slot]').length===24;}); })()`), true);

  const band = await widgetCenter();
  const gr = await gridRect();
  const midArea = { x: gr.x + gr.width / 2, y: gr.top + (gr.height / 6) * 2.2 };
  await mouse('mousePressed', band.x, band.y);
  await wait(470);
  equal('widget picked up (ghost follows the pointer)', await evaluate(`document.querySelectorAll('.home__ghost--widget').length`), 1);
  await mouse('mouseMoved', midArea.x, midArea.y);
  await mouse('mouseReleased', midArea.x, midArea.y);
  await wait(250);
  const mid = await widgetAt();
  ok('widget settles on a middle row (not only top/bottom)', mid.row > 0 && mid.row < 4, mid);
  ok('widget is drawn inside a grid cell', await evaluate(`!!document.querySelector('.home__cell--widget')`));
  const flat = await evaluate(`[].concat.apply([], SN.store.snapshot().settings.homeLayout)`);
  equal('no duplicated icons after the widget covered some', new Set(flat.filter(Boolean)).size, flat.filter(Boolean).length);
  await evaluate('SN.store.applySnapshot(JSON.parse(JSON.stringify(SN.store.snapshot())))');
  await wait(300);
  same('widget position travels with the backup', await widgetAt(), mid);
  /* applySnapshot 会让桌面回到第一页，先把视图带回小组件所在的页再继续拖 */
  wpos = await widgetAt();
  await evaluate(`document.querySelectorAll('.home__dot')[${wpos.page}].click()`);
  await wait(450);
  say('widget lives anywhere in the grid (not just top/bottom) + backup round trip');

  /* 手指放在第 5 行（倒数第二行）也要能落到最下面两行：修复前第 4 行会被顶回第 3 行，
     用户怎么拖都放不到最下面。落点要等长按生效后再取（进入编辑态时桌面会缩放）。 */
  const bandMid = await widgetCenter();
  await mouse('mousePressed', bandMid.x, bandMid.y);
  await wait(470);
  const gr2 = await gridRect();
  const rowFive = { x: gr2.x + gr2.width / 2, y: gr2.top + (gr2.height / 6) * 4.5 };
  await mouse('mouseMoved', rowFive.x, rowFive.y);
  await mouse('mouseReleased', rowFive.x, rowFive.y);
  await wait(250);
  equal('dropping on the 5th row lands the widget on the bottom two rows', (await widgetAt()).row, 4);

  /* 再从底部拖到屏幕最下缘（手指在第 6 行）→ 仍然吸附在最下面两行 */
  const bandLow = await widgetCenter();
  await mouse('mousePressed', bandLow.x, bandLow.y);
  await wait(470);
  const lower = await evaluate(`(() => { const r=document.querySelector('.home__pager').getBoundingClientRect(); return {x:r.x+r.width/2, y:r.bottom-20}; })()`);
  await mouse('mouseMoved', lower.x, lower.y);
  await mouse('mouseReleased', lower.x, lower.y);
  await wait(250);
  equal('dropping on the lower half snaps the widget to the bottom rows', (await widgetAt()).row, 4);
  say('widget drags to the bottom rows of the grid');

  /* 拖到右边缘 → 跟着换页 */
  const band3 = await widgetCenter();
  const edgeW = await evaluate(`(() => { const r=document.querySelector('.home__pager').getBoundingClientRect(); const w=document.querySelector('.home__cell--widget .widget').getBoundingClientRect(); return {x:r.right-8, y:w.y+w.height/2}; })()`);
  const before = (await widgetAt()).page;
  await mouse('mousePressed', band3.x, band3.y);
  await wait(470);
  await mouse('mouseMoved', edgeW.x, edgeW.y);
  await wait(750);
  await mouse('mouseReleased', edgeW.x, edgeW.y);
  await wait(250);
  equal('widget follows the page flip at the edge', (await widgetAt()).page, before + 1);
  say('widget moves to another page via the edge');
  }

  // 编辑模式下点图标不打开应用；按「完成」退出后再点才会打开（用户上报的第 2 个 bug）。
  await evaluate(`document.querySelector('.home__done').click()`);
  await wait(400);
  equal('edit mode left by the Done button', await evaluate(`document.querySelectorAll('.home__pager.is-editing').length`), 0);
  /* 找到「有图标的那一页」，再点它上面的图标（小组件可能落在没有图标的那一页上） */
  const pWithIcon = await evaluate(`SN.store.snapshot().settings.homeLayout.findIndex(function (p) { return Array.isArray(p) && p.some(Boolean); })`);
  ok('some page still holds an icon', pWithIcon >= 0, pWithIcon);
  await evaluate(`document.querySelectorAll('.home__dot')[${pWithIcon}].click()`);
  await wait(450);
  const iconIndex = await evaluate(`SN.store.snapshot().settings.homeLayout[${pWithIcon}].findIndex(Boolean)`);
  const target = await cell(iconIndex);
  await mouse('mousePressed', target.x, target.y);
  await mouse('mouseReleased', target.x, target.y);
  await wait(650);
  ok('tapping an icon opens the app', await evaluate(`!!document.querySelector('.app-header')`));
  await closeApp();
  equal('leaving the app does not fall into edit mode', await evaluate(`document.querySelectorAll('.home__pager.is-editing').length`), 0);
  ok('home grid is back', await evaluate(`!!document.querySelector('.home__cell')`));
  /* 最后再演一次「浏览器根本没有 Battery Status API」的世界（Safari / 部分 Firefox）：
     在页面脚本跑之前把 navigator.getBattery 摘掉，然后刷新——状态栏必须退回设置里
     保存的手动值（上面刚拖到 42），不报错、不空白。这一步放在最后，刷新页面不会影响前面的断言。 */
  await send('Page.enable');
  const stripper = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try { Object.defineProperty(navigator, 'getBattery', { value: undefined, configurable: true }); } catch (e) {}`
  });
  await send('Page.reload', { ignoreCache: true });
  await until('app rebooted without the Battery Status API', `!!document.querySelector('.home__cell')`, 20000);
  await wait(250);
  const noApi = await batteryNow();
  equal('no API: the browser really lost getBattery', await evaluate(`typeof navigator.getBattery`), 'undefined');
  equal('no API: the saved manual level drives the bar', noApi.level, await manualLevel());
  equal('no API: the manual level survived the reload', noApi.level, 42);
  equal('no API: the value is not marked as a real reading', noApi.real, false);
  equal('no API: no charging bolt either', noApi.hasBolt, false);
  ok('no API: the status bar still draws a battery glyph', noApi.glyph);
  ok('no API: the fill width still matches the level', Math.abs(noApi.fill - Math.max(2.2, (12.8 * noApi.level) / 100)) < 0.2, noApi);
  /* 这个世界的「美化」也得写清为什么读不到，而且手动拉条仍然能用 */
  await openApp('beautify');
  const noApiUi = await batteryUi();
  equal('no API: the manual slider is still usable', noApiUi.disabled, false);
  ok('no API: the hint explains why the level is not readable', noApiUi.hint.length > 0 && noApiUi.hint.indexOf('已读到本机电量') === -1, noApiUi.hint);
  await closeApp();
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: stripper.identifier });
  say('battery: without the Battery Status API the bar falls back to the saved manual level (' + noApi.level + '%)');

  same('no console errors during the whole run', errors, []);
  say('open/close app does not fall into edit mode');
  console.log('ALL BROWSER CHECKS PASSED');
})().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => {
  if (socket) socket.close();
  if (server) server.close();
  if (browser) {
    /* Edge 会派生出多个子进程，只 kill 主进程会留下僵尸，越跑越慢 */
    const pid = browser.pid;
    browser.kill();
    if (process.platform === 'win32' && pid) {
      try { spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' }); } catch {}
    }
  }
  await wait(1200);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
});


