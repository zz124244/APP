const { spawnSync } = require('child_process')
const path = require('path'), fs = require('fs')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 8731
const out = process.argv[2]
const url = process.argv[3]
const errFile = out.replace(/\.png$/, '.err.log')
const r = spawnSync(CHROME, [
  '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--force-device-scale-factor=1',
  `--user-data-dir=${path.join(__dirname, 'out', 'pz-' + Date.now())}`,
  `--host-resolver-rules=MAP * 127.0.0.1:${PORT}`,
  '--virtual-time-budget=10000',
  `--screenshot=${out}`, url,
], { stdio: ['ignore', 'ignore', fs.openSync(errFile, 'w')], timeout: 90000 })
console.log('exit', r.status, 'exists', fs.existsSync(out), fs.existsSync(out) ? fs.statSync(out).size : 0)
if (fs.existsSync(errFile)) console.log(fs.readFileSync(errFile, 'utf8').slice(0, 800))
