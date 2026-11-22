export type DocumentKind='terms'|'compliance'
export type ContentSection={id:string;title:string;text:string;image_id:string|null}
export type ContentDocument={configured:boolean;headline:string;sections:ContentSection[]}
export function validateContentDocument(value:any,kind:DocumentKind):ContentDocument{
 if(!value||typeof value.configured!=='boolean'||typeof value.headline!=='string'||!Array.isArray(value.sections)||value.sections.length>100)throw Error('content_invalid')
 if(!value.configured){if(value.sections.length!==0||value.headline!=='')throw Error('content_invalid');return value}
 if(value.sections.length===0)throw Error('content_invalid')
 const ids=new Set<string>()
 for(const s of value.sections){if(!s||typeof s.id!=='string'||!/^[a-z][a-z0-9-]{0,39}$/.test(s.id)||ids.has(s.id)||typeof s.title!=='string'||typeof s.text!=='string'||!s.text.trim()||s.text.length>40000||s.title.length>400||!(s.image_id===null||typeof s.image_id==='string'&&/^[1-9][0-9]{0,18}$/.test(s.image_id)))throw Error('content_invalid');ids.add(s.id);if(kind==='terms'&&s.image_id!==null||kind==='compliance'&&(!s.title||s.image_id===null))throw Error('content_invalid')}
 if(kind==='compliance'&&(!value.headline||value.sections.length<2||value.sections[0].id!=='base-1'||value.sections[1].id!=='base-2')||kind==='terms'&&value.headline!=='')throw Error('content_invalid')
 return value
}
export const contentParagraphs=(text:string)=>text.replace(/\r\n/g,'\n').split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean)
export async function loadDocument(api:{request<T>(path:string):Promise<T>},kind:DocumentKind):Promise<ContentDocument>{return validateContentDocument(await api.request('/content/'+kind),kind)}
