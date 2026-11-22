export type PurchaseDraft={key:string;preview:Record<string,unknown>&{preview_token:string;amount:string}}
export type Product={id:string;version:string;revision:string;name:string;category:string;daily_rate:string;daily_percent:string;term_days:number;minimum:string;payout_mode:'daily'|'maturity';description:string;minimum_vip_level:number;progress:string;expected_interest:string;blocked_reason:string|null}
export type InvestmentPreview={product:Product;amount:string;available:string;starts_at:string;matures_at:string;expected_interest:string;payment_setup_required:boolean;preview_token:string}&Record<string,unknown>
export type InvestmentOrder={order_no:string;product_name:string;category:string;principal:string;daily_percent:string;term_days:number;payout_mode:'daily'|'maturity';purchased_at:string;starts_at:string;matures_at:string;status:'pending_start'|'accruing'|'settling'|'matured'|'exception';elapsed_days:number;remaining_days:number;interest_paid:string;expected_interest:string}
export function recoveryDecision(value:{status:string;retryable?:boolean}){if(value.status==='succeeded')return 'success';if(value.status==='processing')return value.retryable?'retry':'wait';return value.retryable?'retry':'closed'}
export function beginProductZone<T>(current:{category:string;items:T[];more:boolean;page:number},category:string){return {...current,category,items:[] as T[],more:false,page:1}}
export async function setupPaymentPassword(api:{request:<T>(path:string,body?:unknown,headers?:Record<string,string>)=>Promise<T>},uid:string,password:string,confirmation:string,storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>,keyFactory:()=>string){
 const name='payment-setup:'+uid;let key=storage.getItem(name)
 if(!key||!/^[a-f0-9]{32}$/.test(key)){key=keyFactory();storage.setItem(name,key)}
 try{
  const data=await api.request<{state:string}>('/security/payment-password/set',{new_password:password,new_password_confirmation:confirmation},{'Idempotency-Key':key})
  if(data.state!=='ready')throw new Error('payment_setup_pending')
  if(storage.getItem(name)===key)storage.removeItem(name)
  return data
 }catch(error){
  if(error instanceof Error&&error.message==='account_unavailable'){
   try{
    const result=await api.request<{status:string;retryable?:boolean}>('/business-results/payment.setup/'+key)
    const state=await api.request<{state:string}>('/security/payment-password')
    if(result.status==='failed'&&result.retryable===false&&state.state==='never_set'&&storage.getItem(name)===key)storage.removeItem(name)
   }catch{/* Preserve the original key when server state cannot be established. */}
  }
  throw error
 }
}
export function readPurchaseDraft(raw:string|null):PurchaseDraft|null{try{const d=JSON.parse(raw||'null');if(!d||Object.keys(d).some(k=>!['key','preview'].includes(k))||typeof d.key!=='string'||!/^[a-f0-9]{32}$/.test(d.key)||typeof d.preview?.preview_token!=='string'||typeof d.preview?.amount!=='string')return null;return d}catch{return null}}
export async function executePurchase<T>(options:{draft:PurchaseDraft;password:string;active:()=>boolean;persist:(draft:PurchaseDraft)=>void;post:(body:{product_id:string;product_version_id:string;amount:string;preview_token:string;payment_password:string},key:string)=>Promise<T>}):Promise<{status:'abandoned'}|{status:'received';result:T}>{if(!options.active())return {status:'abandoned'};options.persist(options.draft);const result=await options.post({product_id:(options.draft.preview.product as Product).id,product_version_id:(options.draft.preview.product as Product).version,amount:options.draft.preview.amount,preview_token:options.draft.preview.preview_token,payment_password:options.password},options.draft.key);return options.active()?{status:'received',result}:{status:'abandoned'}}
