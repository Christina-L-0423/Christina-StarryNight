/* tools/scan-features.js — 为 FEATURE-BLUEPRINT 收集素材：
   对 js/legacy-*.js 每个文件输出：大小、localStorage 键、函数/常量名、分区注释。
   对 index.html 输出：页面 section / 关键容器。 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const jsDir = path.join(ROOT, 'js');

function scanJs() {
  const files = fs.readdirSync(jsDir).filter(f => /legacy-\d{2}\.js/.test(f)).sort();
  for (const f of files) {
    const s = fs.readFileSync(path.join(jsDir, f), 'utf8');
    const keys = [...new Set([...s.matchAll(/['"`](ib_m_[a-z0-9_]+|mobilePrefs\.[a-z]+\.[a-z0-9_]+|ib_[a-z0-9_]{3,})['"`]/gi)].map(m => m[1]))].slice(0, 22);
    const fns = [...new Set([...s.matchAll(/(?:function\s+|const\s+)([A-Za-z_$][\w$]*)\s*(?:=\s*(?:function|\()|\()/g)].map(m => m[1]))].filter(k => !/^(if|for|while|switch|catch|return)$/.test(k)).slice(0, 16);
    const secs = [...s.matchAll(/(?:\/\*|\/\/)\s*(──+|══+)[^\r\n]{0,46}/g)].map(m => m[0].replace(/\s+/g, ' ').slice(2, 60)).slice(0, 5);
    console.log('== ' + f + '  ' + fs.statSync(path.join(jsDir, f)).size + 'B');
    if (keys.length) console.log('  keys: ' + keys.join(', '));
    if (fns.length) console.log('  fns : ' + fns.join(', '));
    if (secs.length) console.log('  sec : ' + secs.join(' | '));
  }
}

function scanHtml() {
  const s = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const pages = [...s.matchAll(/<section\b[^>]*id="page-([a-z0-9-]+)"[^>]*>|<div\b[^>]*class="page"[^>]*id="page-([a-z0-9-]+)"/gi)].map(m => m[1] || m[2]);
  console.log('\nPAGES: ' + [...new Set(pages)].join(', '));
  const subs = [...s.matchAll(/<(div|section)\b[^>]*id="(sub-[a-z0-9-]+|conv|cv-[a-z0-9-]+|music-app|drawer|topbar|dock|ib-splash)"[^>]*>/gi)].map(m => m[2]);
  console.log('LAYERS: ' + subs.join(', '));
}

scanJs();
scanHtml();