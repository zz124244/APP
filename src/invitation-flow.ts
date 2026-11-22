export type Invitation={invite_code:string;invite_url:string}
export async function loadInvitationData(state:{invitation:Invitation|undefined;qr:string;qrError:boolean},read:()=>Promise<Invitation>,encode:(url:string)=>Promise<string>,active:()=>boolean){const value=await read();if(!active())return;state.invitation=value;state.qr='';state.qrError=false;try{const image=await encode(value.invite_url);if(active())state.qr=image}catch{if(active())state.qrError=true}}
export async function copyInvitationValue(value:string,write:(value:string)=>Promise<void>){try{await write(value);return true}catch{return false}}
export async function copyInvitationAndMark(state:{copiedType:string},type:string,value:string|undefined,write:(value:string)=>Promise<void>){if(!value)return false;const copied=await copyInvitationValue(value,write);if(copied)state.copiedType=type;return copied}
export async function writeClipboardText(value:string,env:{navigator?:{clipboard?:{writeText?:(value:string)=>Promise<void>}};document?:{body?:{appendChild:(node:unknown)=>void};createElement:(tag:string)=>any;execCommand?:(command:string)=>boolean}}={}){
 const nav=env.navigator??(typeof navigator!=='undefined'?navigator:undefined),doc=env.document??(typeof document!=='undefined'?document:undefined)
 try{if(nav?.clipboard?.writeText){await nav.clipboard.writeText(value);return}}catch{}
 if(!doc?.body||!doc.execCommand)throw Error('clipboard_unavailable')
 const field=doc.createElement('textarea');field.value=value;field.setAttribute('readonly','');field.setAttribute('aria-hidden','true');field.style.position='fixed';field.style.left='-9999px';field.style.top='0';doc.body.appendChild(field);field.focus();field.select()
 try{if(!doc.execCommand('copy'))throw Error('clipboard_unavailable')}finally{field.remove()}
}
