const configuredBase=import.meta.env?.VITE_API_ORIGIN||''
export function publicMediaUrl(url:string,base:string=configuredBase):string {
 if(!/^\/media\/editorial\/[1-9][0-9]*\?/.test(url))return ''
 return base.replace(/\/$/,'')+url
}
export function publicMallImageUrl(url:string|null,base:string=configuredBase):string {
 if(!url||!/^\/mall\/images\/mall\/[A-Za-z0-9_-]{40}\.jpg$/.test(url))return ''
 return base.replace(/\/$/,'')+url
}
