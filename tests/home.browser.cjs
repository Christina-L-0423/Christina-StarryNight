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
  const expected = await evaluate('SN.apps.map(function(a){return a.name;})');
  same('every app rendered somewhere in the grid', (await slots()).filter(Boolean), expected);
  const size = await evaluate(`(() => { const g=document.querySelector('.home__grid').getBoundingClientRect(); const rh=g.height/6; const pages=[...document.querySelectorAll('.home__page')]; const w=document.querySelector('.home__cell--widget'); const wt=w.querySelector('.widget'); const icons=[...pages[0].querySelectorAll('[data-slot]')]; const h=icons.map(el=>el.getBoundingClientRect().height); const bands=[...new Set(icons.map(function(el){return Math.round((el.getBoundingClientRect().top-g.top)/rh);}))]; const wbands=[...new Set([].concat.apply([],[...pages[0].querySelectorAll('.home__cell--widget,.home__cell--widget-ghost')].map(function(el){return [Math.round((el.getBoundingClientRect().top-g.top)/rh),Math.round((el.getBoundingClientRect().bottom-g.top)/rh)];})))]; return {grid:Math.round(g.height),row:Math.round(rh),min:Math.round(Math.min.apply(null,h)),iconCells:icons.length,rowBands:bands.length,widgetBands:wbands.length,widgetTop:Math.round(wt.getBoundingClientRect().top-g.top),slotsPerBand:icons.length/4}; })()`);
  equal('grid is 4 columns x 6 rows (24 slots)', size.slotsPerBand, 4);
  equal('widget covers 4x2 = two whole rows', size.widgetBands, 2);
  equal('the other four rows hold 4x4 = 16 icon cells', size.iconCells, 16);
  ok('all six rows are usable and compact', size.grid >= 456 && size.min >= 60 && size.row >= 76, size);
  equal('icons span the four free row bands', size.rowBands, 4);
  ok('widget starts on a grid row', size.widgetTop % size.row <= 1, size);
  say('boot: 4x6 grid (24 slots, widget = 4x2), all apps rendered');

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

  const first = (await slots())[8];
  ok('slot 8 holds an icon (the widget rows push icons away)', first);
  await dropIcon(8, 23);
  let now = await slots();
  equal('source slot is now empty', now[8], null);
  equal('icon landed in slot 23', now[23], first);
  const saved = await evaluate('SN.store.snapshot().settings.homeLayout');
  equal('empty slot persisted', saved[0][8], null);
  equal('dropped slot persisted', saved[0][23], await evaluate('SN.apps[0].id'));
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

  // 小组件：和图标一样住在网格里 —— 可以停在任意一行（不再只有最上或最下），拖到边缘跟着换页，位置随备份走。
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

  /* 拖到下半屏 → 吸附到网格最下面两行。
   注意落点要在长按生效「之后」再取：进入编辑态时桌面会缩放，提前量的坐标会落出缩放后的视口。 */
  const band2 = await widgetCenter();
  await mouse('mousePressed', band2.x, band2.y);
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


