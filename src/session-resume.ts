export function createSessionResume(verify:()=>Promise<void>,covered:(value:boolean)=>void,failed:(value:boolean)=>void,rejected?:(error:unknown)=>void){
 let epoch=0
 return {
  hide(){epoch++;covered(true);failed(false)},
  async resume(){const run=++epoch;covered(true);failed(false);try{await verify();if(run===epoch)covered(false)}catch(error){if(run===epoch){rejected?.(error);if(run===epoch)failed(true)}}},
  cancel(){epoch++;covered(false);failed(false)}
 }
}
