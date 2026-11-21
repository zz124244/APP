export type AddressFields={name:string;phone:string;region:string;address:string}
export type AddressRecord=AddressFields&{is_default:boolean}
export type AddressState={version:string;address:AddressRecord|null}
export type AddressDraft={uid:string;key:string;kind:'save'|'delete';version:string}
export type AddressReceipt={version:string;exists:boolean}
type Api={request<T>(path:string,body?:unknown,headers?:Record<string,string>,method?:'PUT'|'DELETE'):Promise<T>}
type Store={getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem?(key:string):void}
export function readAddressDraft(raw:string|null,uid:string):AddressDraft|null{
 try{const d=JSON.parse(raw||'null');if(!d||Object.keys(d).sort().join(',')!=='key,kind,uid,version'||d.uid!==uid||!['save','delete'].includes(d.kind)||typeof d.key!=='string'||!/^[-A-Za-z0-9_.:]{8,128}$/.test(d.key)||typeof d.version!=='string'||!/^(0|[1-9][0-9]{0,18})$/.test(d.version))return null;return d}catch{return null}
}
export function saveAddressDraft(s:Store,scope:string,d:AddressDraft){const raw=JSON.stringify(d);const previous=s.getItem(scope);if(previous!==null&&previous!==raw)throw Error('storage');s.setItem(scope,raw);if(s.getItem(scope)!==raw)throw Error('storage')}
export function clearAddressDraft(s:Store,scope:string,key:string){const raw=s.getItem(scope);if(!raw)return true;let d;try{d=JSON.parse(raw)}catch{return false}if(d.key!==key)return false;s.removeItem?.(scope);if(s.getItem(scope)!==null)throw Error('storage');return true}
export function validAddressFields(f:AddressFields):boolean{
 for(const [field,max] of [['name',120],['phone',64],['region',200],['address',1000]] as const){const v=f[field];if(typeof v!=='string'||!v.trim()||Array.from(v).length>max||/[\u0000-\u001f\u007f]/.test(v))return false}
 return /^\+?[0-9 ()-]+$/.test(f.phone.trim())&&/^[0-9]{7,20}$/.test(f.phone.replace(/\D/g,''))
}
export async function verifyAddress(api:Api,receipt:AddressReceipt,expected?:AddressFields):Promise<{list:AddressState;edited:AddressState}>{
 const edited=await api.request<AddressState>('/address/edit')
 if(edited.version!==receipt.version||Boolean(edited.address)!==receipt.exists)throw Error('address_changed')
 if(expected&&(!edited.address||(['name','phone','region','address'] as const).some(k=>edited.address![k]!==expected[k].trim())))throw Error('address_changed')
 const list=await api.request<AddressState>('/address')
 if(list.version!==receipt.version||Boolean(list.address)!==receipt.exists)throw Error('address_changed')
 return{list,edited}
}
export async function resolveAddress(api:Api,d:AddressDraft):Promise<{status:'not_applied'}|{status:'succeeded';result:AddressReceipt}>{
 const r=await api.request<{status:string;result?:AddressReceipt}>('/address/recovery/'+d.key,{})
 if(r.status==='not_applied')return{status:'not_applied'}
 if(r.status!=='succeeded'||!r.result||typeof r.result.version!=='string'||typeof r.result.exists!=='boolean')throw Error('invalid_address_result')
 return{status:'succeeded',result:r.result}
}
