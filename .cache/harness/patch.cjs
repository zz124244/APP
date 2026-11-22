const fs = require('fs'), path = require('path')
const root = path.resolve(__dirname, 'public')
// 1) point the baked API origin at the local stub (same-origin /api/v1)
const jsDir = path.join(root, 'assets')
for (const f of fs.readdirSync(jsDir)) {
  if (!f.endsWith('.js')) continue
  const p = path.join(jsDir, f)
  const src = fs.readFileSync(p, 'utf8')
  const next = src.split('https://api.jiuhechuangtou.com').join('')
  if (next !== src) { fs.writeFileSync(p, next); console.log('patched origin in ' + f + ' (' + (src.length - next.length) + ' chars removed)') }
}
// 2) inject the probe into index.html
const idx = path.join(root, 'index.html')
let html = fs.readFileSync(idx, 'utf8')
if (!html.includes('audit.js')) {
  html = html.replace('</head>', '<script src="/audit.js"></script></head>')
  fs.writeFileSync(idx, html)
  console.log('injected audit.js')
}
console.log(html)
