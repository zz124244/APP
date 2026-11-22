export function createSupportAvatarReader(options:{download:(id:string)=>Promise<Blob>;create:(image:Blob)=>string;revoke:(url:string)=>void;changed:(url:string|null)=>void;failed:(error:unknown)=>void}){
 let generation=0,current:string|null=null,url:string|null=null,pending=false,disposed=false
 function clear(){generation++;if(url)options.revoke(url);url=null;pending=false;options.changed(null)}
 return {async load(id:string|null|undefined){
  const next=typeof id==='string'&&/^[1-9][0-9]{0,18}$/.test(id)?id:null
  if(disposed)return
  if(next!==current){clear();current=next}
  if(!current||url||pending)return
  pending=true;const run=generation,target=current
  try{const image=await options.download(target);if(disposed||run!==generation)return;url=options.create(image);options.changed(url)}catch(error){if(!disposed&&run===generation)options.failed(error)}finally{if(run===generation)pending=false}
 },reset(){if(!disposed)clear()},dispose(){disposed=true;clear()}}
}
