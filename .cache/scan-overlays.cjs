const fs = require('fs'), path = require('path')
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (['node_modules', '.cache', 'dist', '.git'].includes(e.name)) continue; walk(p, out) }
    else out.push(p)
  }
  return out
}
const files = walk('src').filter(f => f.endsWith('.vue'))
console.log('=== overlay / fixed layers: does the inner panel cap height or scroll? ===')
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/)
  lines.forEach((line, i) => {
    // find class attributes that contain fixed + inset-0 (overlay)
    const re = /class="([^"]*)"/g
    let m
    while ((m = re.exec(line))) {
      const cls = m[1]
      if (!/\bfixed\b/.test(cls)) continue
      if (!/inset-0|inset-x-0/.test(cls)) continue
      // look ahead 400 chars for the panel classes
      const after = line.slice(m.index + m[0].length, m.index + m[0].length + 420)
      const panelCls = (after.match(/class="([^"]*)"/) || [, ''])[1]
      const hasMaxH = /max-h-\[|max-h-full|max-h-screen/.test(panelCls)
      const hasScroll = /overflow-y-auto|overflow-auto/.test(panelCls)
      console.log(`${f}:${i + 1} overlay=[${cls.trim().slice(0, 70)}] panel=[${panelCls.slice(0, 90)}] maxH=${hasMaxH} scroll=${hasScroll}`)
    }
  })
}
