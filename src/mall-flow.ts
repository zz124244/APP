export type MallDraft={uid:string;productId:string;version:string;key:string}
export type MallReceipt={id:string;public_no:string;product_id:string;name:string;points_price:string;status:'pending_support';fulfillment_id:string}
const id=(v:unknown):v is string=>typeof v==='string'&&/^[1-9][0-9]{0,19}$/.test(v)
export function newMallDraft(uid:string,productId:string,version:string,key:string):MallDraft{return{uid,productId,version,key}}
export function readMallDraft(raw:string|null,uid:string):MallDraft|null{if(!raw)return null;try{const d=JSON.parse(raw);return d&&typeof d==='object'&&!Array.isArray(d)&&Object.keys(d).sort().join(',')==='key,productId,uid,version'&&d.uid===uid&&id(d.productId)&&id(d.version)&&typeof d.key==='string'&&/^[a-f0-9]{32}$/.test(d.key)?d:null}catch{return null}}
export function saveMallDraft(storage:Pick<Storage,'setItem'|'getItem'>,storageKey:string,draft:MallDraft):void{storage.setItem(storageKey,JSON.stringify(draft));if(storage.getItem(storageKey)!==JSON.stringify(draft))throw Error('storage')}
export function clearMallDraft(storage:Pick<Storage,'getItem'|'removeItem'>,storageKey:string,key:string):boolean{const raw=storage.getItem(storageKey);const d=raw?JSON.parse(raw):null;if(!d||d.key!==key)return false;storage.removeItem(storageKey);return storage.getItem(storageKey)===null}
export function mallReceipt(value:unknown,d: MallDraft):MallReceipt|null{const r=value as MallReceipt;return r&&id(r.id)&&id(r.fulfillment_id)&&r.product_id===d.productId&&r.status==='pending_support'&&typeof r.public_no==='string'&&/^[0-9A-HJKMNP-TV-Z]{26}$/.test(r.public_no)&&typeof r.name==='string'&&r.name.trim()!==''&&id(r.points_price)?r:null}
export async function recoverMallDraft(draft:MallDraft,read:()=>Promise<unknown>,post:()=>Promise<unknown>,active:()=>boolean=()=>true):Promise<{status:string;result?:MallReceipt;message_key?:string}>{
 let state:any
 try{state=await read()}catch(e:any){if(e?.status!==404)throw e;state={status:'missing'}}
 if(!active())return{status:'abandoned'}
 if(state?.status==='succeeded'){const r=mallReceipt(state.result,draft);if(!r)throw Error('receipt_invalid');return{status:'succeeded',result:r}}
 if(state?.status==='failed'&&state.retryable===false)return{status:'failed',message_key:state.message_key}
 if(state?.status!=='missing'&&state?.retryable!==true)return{status:'processing'}
 const r=await post();if(!active())return{status:'abandoned'}
 const receipt=mallReceipt(r,draft);return receipt?{status:'succeeded',result:receipt}:{status:'processing'}
}
