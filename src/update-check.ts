export type AppRelease={id:string;platform:string;version:string;build:number;notes:string;download_url:string;bytes:number;sha256:string}
export function createUpdateCheck(read:()=>Promise<{release:AppRelease|null}>,show:(r:AppRelease)=>void){
 let epoch=0,active=false;const dismissed=new Set<number>()
 return {
  async check(page:string,busy:boolean){const run=++epoch;if(busy||!['home','wallet'].includes(page)||active)return;active=true;try{const r=await read();if(run===epoch&&r.release&&!dismissed.has(r.release.build))show(r.release)}catch{}finally{active=false}},
  cancel(){epoch++},dismiss(build:number){dismissed.add(build);epoch++}
 }
}
