/* tools/split-legacy.js
   旧单文件 index.html → 多文件结构（可复现的拆分脚本）：
   1. 逐个抽出 <style>…</style> 块 → styles/app.css（按原顺序合并）
   2. 逐个抽出内联 <script>…</script> 块 → js/legacy-NN.js（原位替换为 <script src>，保持执行顺序）
   3. 外部脚本（已有 src）与带非 JS type 的脚本原样保留
   用法：node tools/split-legacy.js
   */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'archive-legacy', 'index.html');
const OUT_HTML = path.join(ROOT, 'index.html');
const STYLE_OUT = path.join(ROOT, 'styles', 'app.css');
const JS_DIR = path.join(ROOT, 'js');

fs.mkdirSync(path.join(ROOT, 'styles'), { recursive: true });
fs.mkdirSync(JS_DIR, { recursive: true });

const src = fs.readFileSync(SRC, 'utf8');
const blockRe = /<(style|script)\b([^>]*)>([\s\S]*?)<\/\1>/gi;

let cssChunks = [];
let jsCount = 0;
const warnings = [];
const out = src.replace(blockRe, (m, tag, attrs, body) => {
  const lower = tag.toLowerCase();
  const hasSrc = /\bsrc\s*=/i.test(attrs);
  const type = /type\s*=\s*["']([^"']+)["']/i.exec(attrs);
  const typeVal = type ? type[1].toLowerCase() : '';

  if (lower === 'style') {
    cssChunks.push(body);
    return '<!-- [split-legacy] moved to styles/app.css -->\n<link rel="stylesheet" href="./styles/app.css">';
  }
  // script
  if (hasSrc) return m; // 外部脚本原样保留
  if (typeVal && typeVal !== 'text/javascript' && typeVal !== 'application/javascript' && typeVal !== 'module') {
    return m; // 模板/数据型脚本原样保留（不被浏览器执行）
  }
  if (/<\/script/i.test(body)) {
    warnings.push(`script block contains '</script' inside — check manually near: ${body.slice(0, 80)}`);
  }
  const n = String(jsCount++).padStart(2, '0');
  const fname = `legacy-${n}.js`;
  fs.writeFileSync(path.join(JS_DIR, fname), body, 'utf8');
  return `<!-- [split-legacy] moved to js/${fname} -->\n<script src="./js/${fname}"></script>`;
});

fs.writeFileSync(STYLE_OUT, cssChunks.join('\n'), 'utf8');
fs.writeFileSync(OUT_HTML, out, 'utf8');

console.log(`OK  style blocks merged: ${cssChunks.length} -> styles/app.css (${fs.statSync(STYLE_OUT).size} bytes)`);
console.log(`OK  script blocks extracted: ${jsCount} -> js/legacy-*.js`);
console.log(`OK  new index.html: ${fs.statSync(OUT_HTML).size} bytes`);
if (warnings.length) console.log('WARN\n' + warnings.join('\n'));