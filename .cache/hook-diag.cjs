const fs = require('fs')
const p = 'src/App.vue'
let t = fs.readFileSync(p, 'utf8')
if (t.includes('DiagOverlay v-if')) { console.log('already hooked'); process.exit(0) }
const marker = '</div></template>'
const i = t.lastIndexOf(marker)
if (i < 0) { console.log('marker missing'); process.exit(1) }
const insert = '</div>\n <DiagOverlay v-if="diagOn" @close="diagOn=false"/>\n</template>'
t = t.slice(0, i) + insert + t.slice(i + marker.length)
fs.writeFileSync(p, t)
console.log(t.slice(-300))
