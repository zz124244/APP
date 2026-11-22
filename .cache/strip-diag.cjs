const fs = require('fs')
const p = 'src/App.vue'
let t = fs.readFileSync(p, 'utf8')
const before = t.length
t = t.split(/\r?\n/).filter(line => !line.includes('<DiagOverlay')).join('\n')
fs.writeFileSync(p, t)
console.log('removed', before - t.length, 'chars')
console.log(JSON.stringify(t.slice(-160)))
