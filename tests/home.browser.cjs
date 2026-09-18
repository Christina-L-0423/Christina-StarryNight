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
  server = http.createServer((req, res) => {
    const rel = req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0];
    const file = path.resolve(root, '.' + decodeURIComponent(rel));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
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

  // 编辑模式下点图标不打开应用；按「完成」退出后再点才会打开（用户上报的第 2 个 bug）。
  await evaluate(`document.querySelector('.home__done').click()`);
  await wait(400);
  assert.equal(await evaluate(`document.querySelectorAll('.home__pager.is-editing').length`), 0);
  const target = await cell(0);
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


