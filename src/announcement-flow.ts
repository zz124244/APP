export type Announcement={configured:boolean;enabled:boolean;title:string;body:string;version:string}
export function shouldShowAnnouncement(value:Announcement|null|undefined):boolean{
  if(!value||value.configured!==true||value.enabled!==true)return false
  if(typeof value.title!=='string'||value.title.trim()==='')return false
  if(typeof value.body!=='string'||value.body.trim()==='')return false
  return true
}
