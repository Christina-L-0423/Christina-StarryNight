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
let seq = 0;
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
async function cell(index) {
  return evaluate(`(() => { const track=document.querySelector('.home__track'); const m=new DOMMatrix(getComputedStyle(track).transform); const w=document.querySelector('.home__pager').getBoundingClientRect().width; const pg=Math.max(0,Math.round(-m.m41/w)); const r=document.querySelectorAll('.home__page')[pg].querySelectorAll('[data-slot]')[${index}].getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+25}; })()`);
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
async function slots() {
  return evaluate(`(() => { const track=document.querySelector('.home__track'); const m=new DOMMatrix(getComputedStyle(track).transform); const w=document.querySelector('.home__pager').getBoundingClientRect().width; const pg=Math.max(0,Math.round(-m.m41/w)); const grid=document.querySelectorAll('.home__page')[pg].querySelector('.home__grid'); return [...grid.querySelectorAll('[data-slot]')].map(el=>{const l=el.querySelector('.app-icon__label');return l?l.textContent.trim():null;}); })()`);
}
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
  assert.ok(await evaluate('!!window.SN && !!SN.store'), 'SN.store exposed');
  const expected = await evaluate('SN.apps.map(function(a){return a.name;})');
  assert.deepEqual((await slots()).filter(Boolean), expected);
  const size = await evaluate(`(() => { const g=document.querySelector('.home__grid').getBoundingClientRect(); const h=[...document.querySelectorAll('.home__page')[0].querySelectorAll('[data-slot]')].map(el=>el.getBoundingClientRect().height); return {grid:g.height,min:Math.min.apply(null,h)}; })()`);
  assert.ok(size.grid >= 336 && size.min >= 84, JSON.stringify(size));
  console.log('PASS boot: 4x4 grid, every row usable, all apps rendered');

  // 会话列表：超长预览必须截断成一行，不能压到右边箭头上（用户上报的 bug）。
  const chatIcon = await cell(0);
  await mouse('mousePressed', chatIcon.x, chatIcon.y);
  await mouse('mouseReleased', chatIcon.x, chatIcon.y);
  await wait(800);
  assert.ok(await evaluate(`!!document.querySelector('.app-header')`), '聊天应用已打开');
  await evaluate(`(() => { SN.store.state.chats.christina = [{ role: 'them', text: '这是一条特别特别长的聊天记录'.repeat(8), ts: Date.now() }]; return 1; })()`);
  await wait(250);
  const preview = await evaluate(`(() => { const s=document.querySelector('.row__sub'); const c=document.querySelector('.row__chev'); if(!s||!c) return null; const sr=s.getBoundingClientRect(), cr=c.getBoundingClientRect(); return {len:s.textContent.length, display:getComputedStyle(s).display, gap:Math.round(cr.left-sr.right)}; })()`);
  assert.ok(preview, '会话列表里有预览行');
  assert.equal(preview.display, 'block', '预览必须是块级（行内元素上的省略号不生效）');
  assert.ok(preview.len <= 15, '预览被截短到 14 字，实际 ' + preview.len);
  assert.ok(preview.gap > 0, '预览与右边箭头不重叠，gap=' + preview.gap);

  // 通栏 + 右上角时间：列表左右贴住屏幕边缘，行首行右侧显示 时:分。
  const rowExtra = await evaluate(`(() => { const t=document.querySelector('.row__time'); const f=document.querySelector('.list--flush'); const body=document.querySelector('.app-body'); if(!t||!f||!body) return null; const fr=f.getBoundingClientRect(), br=body.getBoundingClientRect(); return { time:t.textContent, timeOk:/^\\d{1,2}:\\d{2}$/.test(t.textContent), leftDelta:Math.round(fr.left-br.left), widthDelta:Math.round(br.width-fr.width) }; })()`);
  assert.ok(rowExtra, '会话行有「上次聊天时间」与通栏容器');
  assert.ok(rowExtra.timeOk, '右上角显示 时:分，实际 ' + rowExtra.time);
  assert.ok(Math.abs(rowExtra.leftDelta) <= 1 && Math.abs(rowExtra.widthDelta) <= 1, '列表左右顶格 ' + JSON.stringify(rowExtra));

  // 点开对话：微信式时间分割线（首条消息上方显示 时:分）。
  const rowRect = await evaluate(`(() => { const r=document.querySelector('.list--flush .row'); const b=r.getBoundingClientRect(); return {x:Math.round(b.left+b.width/2), y:Math.round(b.top+b.height/2)}; })()`);
  await mouse('mousePressed', rowRect.x, rowRect.y);
  await mouse('mouseReleased', rowRect.x, rowRect.y);
  await wait(400);
  const stamps = await evaluate(`(() => [...document.querySelectorAll('.chat__stamp')].map(function (e) { return e.textContent; }))()`);
  assert.ok(stamps.length >= 1, '聊天里有时间分割线，实际 ' + JSON.stringify(stamps));
  assert.ok(/^\d{1,2}:\d{2}$/.test(stamps[stamps.length - 1]), '分割线是 时:分 格式，实际 ' + stamps[stamps.length - 1]);
  await evaluate('SN.store.closeApp()');
  await wait(700);
  console.log('PASS chat list: flush edges, row time, 14-char preview, time stamps');

  // 角色集：竖向居中角色卡 + 简介；角色编辑有「简介」字段；简介不进提示词。
  const promptSrc = fs.readFileSync(path.join(root, 'assets/js/logic/prompt.js'), 'utf8');
  assert.ok(!/\bintro\b/.test(promptSrc), 'prompt.js 不读取 intro（简介不会发给 AI）');
  await evaluate(`SN.store.openApp('characters')`);
  await wait(500);
  const charUi = await evaluate(`(() => { const l=document.querySelector('.char-list'); const c=document.querySelector('.char-card'); const i=document.querySelector('.char-card__intro'); if(!l||!c||!i) return null; return { dir:getComputedStyle(l).flexDirection, name:c.querySelector('.char-card__name').textContent, introLen:i.textContent.length }; })()`);
  assert.ok(charUi, '角色集渲染了角色卡');
  assert.equal(charUi.dir, 'column', '角色卡竖向排列');
  assert.ok(charUi.introLen > 0, '角色卡显示简介（' + charUi.name + '）');
  await evaluate(`SN.store.openApp('characterEdit', { characterId: 'christina' })`);
  await wait(500);
  const editUi = await evaluate(`(() => { const labels=[...document.querySelectorAll('.field__label')].map(e=>e.textContent); const areas=[...document.querySelectorAll('.input--area')]; return { labels:labels, firstAreaDisabled: areas.length ? areas[0].disabled : null }; })()`);
  assert.ok(editUi.labels.indexOf('简介') !== -1, '角色编辑页有「简介」字段，实际 ' + JSON.stringify(editUi.labels));
  assert.equal(editUi.firstAreaDisabled, true, '官方角色（locked）的简介不可编辑');
  await evaluate('SN.store.closeApp()');
  await wait(500);
  console.log('PASS characters view: vertical centered cards + intro field, intro never sent to AI');

  const first = (await slots())[0];
  await dropIcon(0, 15);
  let now = await slots();
  assert.equal(now[0], null);
  assert.equal(now[15], first);
  const saved = await evaluate('SN.store.snapshot().settings.homeLayout');
  assert.equal(saved[0][0], null);
  assert.equal(saved[0][15], await evaluate('SN.apps[0].id'));
  await evaluate('SN.store.applySnapshot(JSON.parse(JSON.stringify(SN.store.snapshot())))');
  assert.equal((await slots())[15], first);
  console.log('PASS free placement keeps empty slots + backup round trip');

  // 右边缘：按住最后一行的图标拖到右缘 → 自动新建一页并把图标带过去。
  const edgeR = await evaluate(`(() => {const r=document.querySelector('.home__pager').getBoundingClientRect(); return {x:r.right-8,y:r.top+60};})()`);
  const fromR = await cell(15);
  await mouse('mousePressed', fromR.x, fromR.y);
  await wait(470);
  await mouse('mouseMoved', edgeR.x, edgeR.y);
  await wait(700);
  assert.equal(await evaluate(`document.querySelectorAll('.home__page').length`), 2);
  await wait(400);
  await mouse('mouseReleased', edgeR.x, edgeR.y);
  await wait(150);
  now = await slots();
  assert.equal(now[3], first);
  assert.equal(now.filter(Boolean).length, 1);
  console.log('PASS right edge auto-creates a page and carries the icon');

  // 点页点回到第一页，再测左边缘的前方插页。
  await evaluate(`document.querySelectorAll('.home__dot')[0].click()`);
  await wait(450);

  const blank = await cell(12);
  await mouse('mousePressed', blank.x, blank.y);
  await mouse('mouseMoved', blank.x + 100, blank.y);
  await wait(80);
  const follow = await evaluate(`(() => { const t=document.querySelector('.home__track'); return {m41:new DOMMatrix(getComputedStyle(t).transform).m41, d:getComputedStyle(t).transitionDuration}; })()`);
  assert.equal(follow.d, '0s');
  assert.ok(Math.abs(follow.m41) > 10, JSON.stringify(follow));
  await mouse('mouseReleased', blank.x + 100, blank.y);
  await wait(90);
  const during = await evaluate(`new DOMMatrix(getComputedStyle(document.querySelector('.home__track')).transform).m41`);
  assert.ok(Math.abs(during) > 1 && Math.abs(during) < 340, 'slide passes an intermediate frame: ' + during);
  await wait(500);
  assert.equal(Math.round(await evaluate(`new DOMMatrix(getComputedStyle(document.querySelector('.home__track')).transform).m41`)), 0);
  console.log('PASS finger-following swipe with smooth slide animation');

  const iconLabel = (await slots()).find(x => x);
  const from = await cell((await slots()).indexOf(iconLabel));
  const edgeL = await evaluate(`(() => {const r=document.querySelector('.home__pager').getBoundingClientRect(); return {x:r.left+8,y:r.top+60};})()`);
  await mouse('mousePressed', from.x, from.y);
  await wait(470);
  await mouse('mouseMoved', edgeL.x, edgeL.y);
  await wait(700);
  assert.equal(await evaluate(`document.querySelectorAll('.home__page').length`), 3);
  await wait(400);
  await mouse('mouseReleased', edgeL.x, edgeL.y);
  await wait(400);
  assert.equal((await slots())[0], iconLabel);
  console.log('PASS left edge inserts a page before the current one');

  // 小组件：编辑模式里也能拖 —— 拖到下半屏移到网格下方，拖到边缘跟着换页，位置随备份走。
  const widgetPage = () => evaluate(`(() => { const w=document.querySelector('.home__widget-slot .widget'); if(!w) return -1; return [...document.querySelectorAll('.home__page')].indexOf(w.closest('.home__page')); })()`);
  const bandCenter = () => evaluate(`(() => { const b=document.querySelector('[data-widget-band]'); if(!b) return null; const r=b.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  const wp = await widgetPage();
  assert.ok(wp >= 0, '小组件在某一页上');
  await evaluate(`document.querySelectorAll('.home__dot')[${wp}].click()`);
  await wait(450);
  assert.equal(await evaluate(`document.querySelectorAll('.home__widget-slot').length`), await evaluate(`document.querySelectorAll('.home__page').length`), '每一页都留出小组件的位置（翻页时行列不错位）');
  const bandTop = await bandCenter();
  await mouse('mousePressed', bandTop.x, bandTop.y);
  await wait(470);
  assert.equal(await evaluate(`document.querySelectorAll('.home__ghost--widget').length`), 1, '小组件被抓起（跟手幽灵出现）');
  const lower = await evaluate(`(() => { const r=document.querySelector('.home__pager').getBoundingClientRect(); return {x:r.x+r.width/2, y:r.bottom-20}; })()`);
  await mouse('mouseMoved', lower.x, lower.y);
  await mouse('mouseReleased', lower.x, lower.y);
  await wait(200);
  assert.equal(await evaluate(`SN.store.snapshot().settings.homeWidget.bottom`), true, '落在下半屏 → 记到网格下方');
  assert.ok(await evaluate(`!!document.querySelector('.home__widget-slot--bottom .widget')`), '小组件确实画在下方那一格');
  console.log('PASS widget drags below the icon grid');

  const bandBottom = await bandCenter();
  const edgeW = await evaluate(`(() => { const r=document.querySelector('.home__pager').getBoundingClientRect(); return {x:r.right-8,y:r.bottom-20}; })()`);
  const before = await evaluate(`SN.store.snapshot().settings.homeWidget.page`);
  await mouse('mousePressed', bandBottom.x, bandBottom.y);
  await wait(470);
  await mouse('mouseMoved', edgeW.x, edgeW.y);
  await wait(700);
  await mouse('mouseReleased', edgeW.x, edgeW.y);
  await wait(200);
  assert.equal(await evaluate(`SN.store.snapshot().settings.homeWidget.page`), before + 1, '小组件跟着翻页换了页');
  assert.equal(await widgetPage(), before + 1, '小组件画在新的一页上');
  console.log('PASS widget moves to another page via the edge');

  // 编辑模式下点图标不打开应用；按「完成」退出后再点才会打开（用户上报的第 2 个 bug）。
  await evaluate(`document.querySelector('.home__done').click()`);
  await wait(400);
  assert.equal(await evaluate(`document.querySelectorAll('.home__pager.is-editing').length`), 0);
  /* 找到「有图标的那一页」，再点它上面的图标（小组件可能落在没有图标的那一页上） */
  const pWithIcon = await evaluate(`SN.store.snapshot().settings.homeLayout.findIndex(function (p) { return Array.isArray(p) && p.some(Boolean); })`);
  assert.ok(pWithIcon >= 0, '存在带图标的页面');
  await evaluate(`document.querySelectorAll('.home__dot')[${pWithIcon}].click()`);
  await wait(450);
  const iconIndex = await evaluate(`SN.store.snapshot().settings.homeLayout[${pWithIcon}].findIndex(Boolean)`);
  const target = await cell(iconIndex);
  await mouse('mousePressed', target.x, target.y);
  await mouse('mouseReleased', target.x, target.y);
  await wait(650);
  assert.ok(await evaluate(`!!document.querySelector('.app-header')`), 'application opened');
  await evaluate('SN.store.closeApp()');
  await wait(650);
  assert.equal(await evaluate(`document.querySelectorAll('.home__pager.is-editing').length`), 0);
  assert.ok(await evaluate(`!!document.querySelector('.home__cell')`));
  assert.deepEqual(errors, []);
  console.log('PASS open/close app does not fall into edit mode');
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


