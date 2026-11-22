import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {createRequire} from 'node:module'
const require=createRequire(import.meta.url),run=promisify(execFile)
const configs=(await readdir('design')).filter(name=>name.endsWith('.config.cjs')).sort()
await mkdir('.cache/reference',{recursive:true})
await Promise.all(configs.map(async name=>{
 const scope=name.replace('.config.cjs',''),target=scope==='profile'?'src/reference-profile.css':'.cache/reference/'+scope+'.css'
 try{await run(process.execPath,[require.resolve('tailwindcss/lib/cli.js'),'-c','design/'+name,'-i','design/reference.css','-o',target,'--minify'],{maxBuffer:5_000_000})}
 catch(error){process.stderr.write(error.stderr||String(error));throw error}
}))
const pieces=[]
for(const name of configs){const scope=name.replace('.config.cjs','');if(scope==='profile')continue;pieces.push(await readFile('design/'+scope+'.base.css','utf8'));pieces.push(await readFile('.cache/reference/'+scope+'.css','utf8'))}
await writeFile('src/reference-pages.css',pieces.join('\n')+'\n')
console.log('Compiled '+configs.length+' original page themes locally.')
