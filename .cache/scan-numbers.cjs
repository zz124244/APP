const fs = require('fs'), path = require('path')
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (['node_modules', '.cache', 'dist', '.git'].includes(e.name)) continue; walk(p, out) }
    else out.push(p)
  }
  return out
}
// Numeric / long-token interpolations that must never be allowed to widen a box:
const risky = /\{\{[^}]*?(amount\(|total|balance|available|withdrawable|frozen|invested|points|recharge|investment_|uid|address|hash|txid|order_no|invite|phone|usdt|USDT|toFixed)[^}]*\}\}/i
const guard = /(min-w-0|truncate|break-all|overflow-wrap|break-words|max-w-\[|tabular-nums|shrink)/

const files = walk('src').filter(f => f.endsWith('.vue'))
const rows = []
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8')
  const tpl = text.slice(text.indexOf('<template>'))
  // element-level scan: <tag ...class="..."...>...{{ }}...</tag>  (single-line templates in this codebase)
  const tagRe = /<([a-zA-Z][\w-]*)\b([^>]*)>([\s\S]*?)<\/\1>/g
  let m
  while ((m = tagRe.exec(tpl))) {
    const body = m[3]
    if (!risky.test(body)) continue
    const attrs = m[2]
    const cls = (attrs.match(/class="([^"]*)"/) || [, ''])[1]
    if (guard.test(cls)) continue
    const line = tpl.slice(0, m.index).split(/\r?\n/).length
    rows.push({ f, line, tag: m[1], cls: cls.slice(0, 110), sample: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) })
  }
}
console.log('unguarded numeric/long-token nodes: ' + rows.length)
for (const r of rows) console.log(`${r.f}:${r.line}  <${r.tag} class="${r.cls}">  "${r.sample}"`)
