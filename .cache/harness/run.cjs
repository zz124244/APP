// Runs headless Chrome against the local harness inside a sized iframe, then extracts the audit JSON.
const { spawnSync } = require('child_process')
const fs = require('fs'), path = require('path')

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = process.env.PORT || 8731
const OUT = path.resolve(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })

const [w, h, flow, tag, authFlag] = process.argv.slice(2)
const name = `${tag || flow}-${w}x${h}`

// set stub auth mode through the local control endpoint
const http = require('http')
function setMode(auth, cb) {
  http.get(`http://127.0.0.1:${PORT}/__mode?auth=${auth}`, r => { r.resume(); r.on('end', cb) }).on('error', e => { console.error('mode error', e.message); cb() })
}

const url = `http://127.0.0.1:${PORT}/frame.html?w=${w}&h=${h}&flow=${flow}`
const common = [
  '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', '--disable-background-networking', '--disable-sync',
  '--disable-component-update', '--disable-client-side-phishing-detection',
  '--metrics-recording-only', '--mute-audio', '--hide-scrollbars',
  `--user-data-dir=${path.join(OUT, 'profile-' + name)}`,
  `--host-resolver-rules=MAP * 127.0.0.1:${PORT}`,
  '--force-device-scale-factor=1',
]
const domFile = path.join(OUT, name + '.html')
const png = path.join(OUT, name + '.png')

function runChrome() {
  spawnSync(CHROME, [...common, '--virtual-time-budget=20000', '--dump-dom', url], {
    stdio: ['ignore', fs.openSync(domFile, 'w'), fs.openSync(path.join(OUT, name + '.err.log'), 'w')], timeout: 120000,
  })
  if (process.env.SHOT === '1') {
    spawnSync(CHROME, [...common, '--virtual-time-budget=20000', `--screenshot=${png}`, url], {
      stdio: ['ignore', 'ignore', 'ignore'], timeout: 120000,
    })
  }
  const html = fs.readFileSync(domFile, 'utf8')
  const m = html.match(/<pre id="__audit">([\s\S]*?)<\/pre>/)
  if (!m) {
    console.log(`[${name}] NO AUDIT MARKER (${html.length} bytes)`)
    const t = html.match(/<title>([^<]*)<\/title>/); if (t) console.log('   title: ' + t[1])
    return
  }
  const decode = s => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")
  const rep = JSON.parse(decode(m[1]))
  console.log(`\n===== ${name} : vw=${rep.vw} vh=${rep.vh} hOverflow=${rep.hOverflow} vOverflow=${rep.vOverflow} offenders=${(rep.offenders || []).length} cutText=${(rep.cutText || []).length} steps=${JSON.stringify(rep.steps || [])} ${rep.error ? 'ERROR=' + rep.error : ''}`)
  for (const o of (rep.offenders || [])) {
    console.log(`  OVER right+${o.rightOver} left+${o.leftOver} innerX=${o.innerX} pos=${o.pos} disp=${o.disp} ow=${o.ow} ws=${o.ws} wb=${o.wb} mw=${o.mw} w=${o.w}  ${o.s}  "${o.txt}"`)
  }
  for (const c of (rep.cutText || [])) {
    console.log(`  CUT  +${c.over}px  ${c.s}  "${c.txt}"  (clip: ${c.anc})`)
  }
  if (rep.buttons) console.log('  BUTTONS: ' + rep.buttons.join(' | '))
  if (rep.inputs) console.log('  INPUTS: ' + rep.inputs.join(' | '))
  if (rep.viewport) console.log('  VIEWPORT: ' + rep.viewport)
  if (rep.scrollProbe) console.log('  SCROLL-PROBE: ' + JSON.stringify(rep.scrollProbe))
}

setMode(authFlag === '0' ? '0' : '1', runChrome)



