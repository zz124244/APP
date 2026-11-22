type ImageOptions={create:(blob:Blob)=>string;revoke:(url:string)=>void;changed?:()=>void;failed?:(error:unknown)=>void}
export function createPrivateImageCache(download:(id:string)=>Promise<Blob>,options:ImageOptions){
  const urls:Record<string,string>={},failed=new Set<string>(),pending=new Map<string,Promise<void>>()
  let disposed=false
  async function load(id:string):Promise<void>{
    if(disposed||urls[id])return
    if(pending.has(id))return pending.get(id)
    const task=(async()=>{try{const image=await download(id);if(disposed)return;urls[id]=options.create(image);failed.delete(id)}catch(error){if(!disposed){failed.add(id);options.failed?.(error)}}finally{pending.delete(id);if(!disposed)options.changed?.()}})()
    pending.set(id,task);return task
  }
  return {urls,failed,load,async retry(ids:string[]){await Promise.all(ids.map(load))},dispose(){disposed=true;Object.values(urls).forEach(options.revoke)}}
}
