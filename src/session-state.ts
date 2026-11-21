export type SessionRecord={access_token?:string;expires_at:string;session_scope:string}
export function createSessionState(store:{read:()=>Promise<string|null>;write:(value:string)=>Promise<void>;remove:()=>Promise<void>},setToken:(t:string|null)=>void,now:()=>number=Date.now){
 let epoch=0,pending:Promise<void>=Promise.resolve()
 function clear(){epoch++;setToken(null);const work=pending.catch(()=>{}).then(()=>store.remove());pending=work;return work}
 async function save(result:SessionRecord){
  if(result.session_scope!=='full'){await clear();return}
  if(!result.access_token||!Number.isFinite(Date.parse(result.expires_at))||Date.parse(result.expires_at)<=now())throw Error('session_invalid')
  const run=++epoch;const work=pending.catch(()=>{}).then(async()=>{if(run===epoch)await store.write(JSON.stringify({token:result.access_token,expires_at:result.expires_at}))});pending=work
  await work
 }
 async function restore<T>(verify:()=>Promise<T>):Promise<T|null>{
  const run=epoch;await pending.catch(()=>{});const raw=await store.read();if(run!==epoch||!raw)return null
  let record:{token:string;expires_at:string}
  try{record=JSON.parse(raw);if(!record||typeof record.token!=='string'||record.token.length>8192||!record.token||typeof record.expires_at!=='string'||!Number.isFinite(Date.parse(record.expires_at))||Date.parse(record.expires_at)<=now())throw Error('session_invalid')}
  catch{await clear();return null}
  setToken(record.token)
  try{const user=await verify();return run===epoch?user:null}catch(e){if(run===epoch){setToken(null);if((e as {status?:number})?.status===401||(e as {status?:number})?.status===403)await clear()}throw e}
 }
 return {save,restore,clear}
}
