import {Capacitor,registerPlugin} from '@capacitor/core'
export const isNative=Capacitor.isNativePlatform()
type SecureBridge={get(options:{key:string}):Promise<{value:string|null}>;set(options:{key:string;value:string}):Promise<void>;remove(options:{key:string}):Promise<void>;info():Promise<{platform:string;build:number;version:string}>;openDownload(options:{url:string}):Promise<void>}
export const nativeBridge=registerPlugin<SecureBridge>('SecureSession')
export const nativeStore={read:async()=>(await nativeBridge.get({key:'auth'})).value,write:async(value:string)=>{await nativeBridge.set({key:'auth',value})},remove:async()=>{await nativeBridge.remove({key:'auth'})}}
export async function installationNonce(){
 if(isNative){const old=(await nativeBridge.get({key:'installation'})).value;if(old&&/^[a-f0-9]{32}$/.test(old))return old}
 else{try{const old=localStorage.getItem('app_installation');if(old&&/^[a-f0-9]{32}$/.test(old))return old}catch{}}
 if(typeof crypto?.getRandomValues!=='function')throw Error('secure_random_unavailable')
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('')
 if(isNative)await nativeBridge.set({key:'installation',value:nonce});else{try{localStorage.setItem('app_installation',nonce)}catch{}}
 return nonce
}
