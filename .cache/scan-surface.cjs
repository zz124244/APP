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
console.log('=== root surface wrappers per page ===')
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8')
  const tpl = t.slice(t.indexOf('<template>'))
  // find all class="..." lists mentioning reference-*
  const re = /class="([^"]*reference-[^"]*)"/g
  let m, rows = []
  while ((m = re.exec(tpl))) {
    const cls = m[1]
    const hasSurface = /\breference-surface\b/.test(cls)
    const scope = (cls.match(/reference-[a-z-]+/g) || []).filter(c => c !== 'reference-surface')
    rows.push({ hasSurface, scope: scope.join(','), tag: tpl.slice(Math.max(0, m.index - 60), m.index).split('<').pop() })
  }
  if (rows.length) {
    const uniq = []
    const seen = new Set()
    for (const r of rows) { const k = r.hasSurface + '|' + r.scope; if (!seen.has(k)) { seen.add(k); uniq.push(r) } }
    console.log(f)
    for (const r of uniq) console.log('   tag<' + (r.tag || '?') + '> surface=' + r.hasSurface + ' scopes=' + r.scope)
  } else {
    console.log(f + '   [no reference-* class found]')
  }
}
