export function normalizePaymentPin(value:string){return value.replace(/[^0-9]/g,'').slice(0,6)}
export function editPaymentPin(value:string,key:string,disabled=false){
  if(disabled)return value
  if(key==='clear')return ''
  if(key==='backspace')return value.slice(0,-1)
  return /^[0-9]$/.test(key)?normalizePaymentPin(value+key):value
}
