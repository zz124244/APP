const fs = require('fs'), path = require('path')
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (['node_modules', '.cache', 'dist', '.git'].includes(e.name)) continue; walk(p, out) }
    else out.push(p)
  }
  return out
}
const files = walk(process.argv[2] || 'src').filter(f => /\.(vue|ts|css)$/.test(f))
const pats = [
  ['w-[px]', /w-\[[^\]]*px\]/g],
  ['min-w-[..]', /min-w-\[[^\]]+\]/g],
  ['max-w-[..]', /max-w-\[[^\]]+\]/g],
  ['left/right/inset-[..]', /(?:^|[\s"'(])-?(?:left|right|inset-x)-\[[^\]]+\]/g],
  ['translate-x-[..]', /translate-x-\[[^\]]+\]/g],
  ['100vw/w-screen', /\b100vw\b|w-screen/g],
  ['100vh/h-screen', /\b100vh\b|h-screen/g],
  ['whitespace-nowrap', /whitespace-nowrap/g],
  ['overflow-x-auto', /overflow-x-auto/g],
  ['dvh/svh', /dvh|svh/g],
  ['style px width', /style="[^"]*(?:width|left|right)[^"]*"/g],
]
for (const [name, re] of pats) {
  console.log('===== ' + name + ' =====')
  let total = 0
  for (const f of files) {
    const t = fs.readFileSync(f, 'utf8')
    const mm = t.match(re)
    if (mm && mm.length) {
      total += mm.length
      const uniq = [...new Set(mm)].slice(0, 12).join(' | ')
      console.log('  ' + f + ' (' + mm.length + ') :: ' + uniq.slice(0, 400))
    }
  }
  console.log('  -- total ' + total)
}
