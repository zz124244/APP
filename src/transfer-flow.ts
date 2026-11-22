export type TransferDraft={key:string;recipient_phone:string;recipient_uid:string;amount:string;recipient_name_masked:string;preview_token:string}
export function readTransferDraft(raw:string|null):TransferDraft|null{
 try{const d=JSON.parse(raw||'null');if(!d||Object.keys(d).length!==6||!Object.keys(d).every(k=>['key','recipient_phone','recipient_uid','amount','recipient_name_masked','preview_token'].includes(k))||Object.values(d).some(v=>typeof v!=='string'))return null
 if(!/^[a-f0-9]{32}$/.test(d.key)||!/^\+861[3-9][0-9]{9}$/.test(d.recipient_phone)||! /^[1-9][0-9]{0,19}$/.test(d.recipient_uid)||! /^(0|[1-9][0-9]{0,21})\.[0-9]{2}$/.test(d.amount)||d.amount.split('.')[0].length<3||!d.recipient_name_masked||d.recipient_name_masked.length>32||!d.preview_token||d.preview_token.length>4096)return null;return d
 }catch{return null}
}
export function recoveryDecision(r:{status:string;retryable?:boolean}){return r.status==='succeeded'?'success':r.status==='failed'&&!r.retryable?'failed':r.retryable?'retry':'wait'}
export async function executeTransfer<T>(o:{draft:TransferDraft;pin:string;active:()=>boolean;persist:(d:TransferDraft)=>void;post:(body:Record<string,string>,key:string)=>Promise<T>}):Promise<T|null>{
 if(!o.active())return null;const d=o.draft;o.persist({key:d.key,recipient_phone:d.recipient_phone,recipient_uid:d.recipient_uid,amount:d.amount,recipient_name_masked:d.recipient_name_masked,preview_token:d.preview_token});if(!o.active())return null
 return o.post({recipient_phone:d.recipient_phone,recipient_uid:d.recipient_uid,amount:d.amount,preview_token:d.preview_token,payment_password:o.pin},d.key)
}
export async function setupTransferPayment(o:{setup:()=>Promise<unknown>;read:()=>Promise<string>;active:()=>boolean}):Promise<{state:string|null;error?:unknown}>{
 try{await o.setup();return {state:o.active()?'ready':null}}catch(error){let state:string|null=null;if(o.active()){try{state=await o.read()}catch{/* Keep the original error; no successful state can be assumed. */}}return {state:o.active()?state:null,error}}
}
