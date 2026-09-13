/* tools/scan-deep06.js — 深扫 legacy-06.js：备份/导入导出、AI 管道、存储键 */
const fs = require('fs');
const s = fs.readFileSync('js/legacy-06.js', 'utf8');
const hits = [...s.matchAll(/(?:function\s+)([a-zA-Z_$][\w$]*)\s*\(/g)].map(m => m[1]);
const want = hits.filter(h => /backup|export|import|restore|genreply|summ|sendmsg|autopost|heart|presence|mcp|tool|bounce|saveai|draw|bounce|chat|send|prompt|system|libs/i.test(h));
console.log('PIPELINE / BACKUP FUNCS:');
console.log([...new Set(want)].join(', '));
const keys = [...s.matchAll(/['"`](ib_m_[a-z0-9_]+)['"`]/gi)].map(m => m[1]);
console.log('\nib_m_ KEYS (' + new Set(keys).size + ' unique, top 60):');
console.log([...new Set(keys)].sort().slice(0, 60).join(', '));