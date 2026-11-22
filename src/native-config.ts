export function nativeApiOrigin(value:string|undefined,allowUsbLoopbackHttp=false):string{
 const url=new URL(value||'')
 const secure=url.protocol==='https:'
 const usbLoopback=allowUsbLoopbackHttp&&url.protocol==='http:'&&url.hostname==='127.0.0.1'
 if((!secure&&!usbLoopback)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('api_origin_required')
 return url.origin
}
