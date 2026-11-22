const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const outDir = path.resolve('.cache/check')
fs.mkdirSync(outDir, { recursive: true })
const files = ['src/App.vue', 'src/AppRoot.vue']
for (const f of files) {
  if (!fs.existsSync(f)) { console.log(f + ': 不存在'); continue }
  const raw = fs.readFileSync(f, 'utf8')
  const m = raw.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)
  if (!m) { console.log(f + ': 没有 <script setup lang="ts"> 块'); continue }
  const target = path.join(outDir, path.basename(f, '.vue') + '.ts')
  fs.writeFileSync(target, m[1])
  const opens = (raw.match(/<template>/g) || []).length
  const closes = (raw.match(/<\/template>/g) || []).length
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--check', target], { encoding: 'utf8' })
  console.log(`${f}: syntax=${r.status === 0 ? 'OK' : 'FAIL'}  <template> ${opens}/${closes}`)
  if (r.status !== 0) console.log((r.stderr || '').split('\n').slice(0, 10).join('\n'))
}
