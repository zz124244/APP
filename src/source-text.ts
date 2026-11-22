import type {Locale} from './i18n'
const labels={
 clearAccount:['清空账号','Clear account','アカウントをクリア','계정 지우기','Effacer le compte','Konto leeren','清空帳號'],
 equityFeatured:['精选股权标的','Selected equity investments','厳選エクイティ商品','엄선된 지분 상품','Sélection de participations','Ausgewählte Beteiligungen','精選股權標的'],
 longTerm:['长期','Long term','長期','장기','Long terme','Langfristig','長期'],
 focus:['专注','Focus','集中','집중','Concentration','Fokus','專注'],
 altruism:['利他','Altruism','利他','이타','Altruisme','Altruismus','利他'],
 vipPool:['· 尊享高净值专属池','· Exclusive private investment pool','· 専用投資プール','· 전용 투자 풀','· Compartiment privé exclusif','· Exklusiver Anlagepool','· 尊享高淨值專屬池'],
 vipYield:['专属高息定制','Exclusive yield options','専用利回り商品','전용 수익 상품','Offres de rendement privées','Exklusive Renditeangebote','專屬高息定制'],
 vipProducts:['VIP 专属高净值产品','Exclusive VIP products','VIP専用商品','VIP 전용 상품','Produits VIP exclusifs','Exklusive VIP-Produkte','VIP 專屬高淨值產品'],
 payoutMode:['计息模式','Interest schedule','利払い方式','이자 지급 방식','Mode de versement','Zinszahlungsart','計息模式'],
 brandWide:['长期 ﹘ 专注 ﹘ 利他','Long term · Focus · Altruism','長期 · 集中 · 利他','장기 · 집중 · 이타','Long terme · Concentration · Altruisme','Langfristig · Fokus · Altruismus','長期 ﹘ 專注 ﹘ 利他'],
 brandPlain:['长期 · 专注 · 利他','Long term · Focus · Altruism','長期 · 集中 · 利他','장기 · 집중 · 이타','Long terme · Concentration · Altruisme','Langfristig · Fokus · Altruismus','長期 · 專注 · 利他'],
 brandQuoted:['「 长期 · 专注 · 利他 」','Long term · Focus · Altruism','「 長期 · 集中 · 利他 」','장기 · 집중 · 이타','Long terme · Concentration · Altruisme','Langfristig · Fokus · Altruismus','「 長期 · 專注 · 利他 」'],
 maturitySettle:['到期自动结算至钱包','Automatically settled to the wallet at maturity','満期時に残高へ自動入金','만기 시 지갑으로 자동 정산','Versement automatique au portefeuille à échéance','Automatische Wallet-Gutschrift bei Fälligkeit','到期自動結算至錢包'],
 stepPlan:['步骤 1/3 · 确认申购计划','Step 1/3 · Review subscription','ステップ1/3 · 購入内容の確認','1/3단계 · 구매 계획 확인','Étape 1/3 · Vérifier la souscription','Schritt 1/3 · Zeichnung prüfen','步驟 1/3 · 確認申購計劃'],
 stepDetails:['步骤 1/3 · 确认申购详情','Step 1/3 · Review subscription details','ステップ1/3 · 購入詳細の確認','1/3단계 · 구매 상세 확인','Étape 1/3 · Vérifier les détails','Schritt 1/3 · Details prüfen','步驟 1/3 · 確認申購詳情'],
 stepPay:['步骤 2/3 · 安全支付','Step 2/3 · Secure payment','ステップ2/3 · 安全な支払い','2/3단계 · 안전 결제','Étape 2/3 · Paiement sécurisé','Schritt 2/3 · Sichere Zahlung','步驟 2/3 · 安全支付'],
 paymentAuth:['九合资管安全扣款认证','JIUHE secure payment verification','九合安全支払い認証','九合 안전 결제 인증','Vérification sécurisée JIUHE','Sichere JIUHE-Zahlungsprüfung','九合資管安全扣款認證'],
 vipPaymentAuth:['九合资管 VIP 私享安全认证','JIUHE VIP secure verification','九合VIP安全認証','九合 VIP 안전 인증','Vérification sécurisée VIP JIUHE','Sichere JIUHE-VIP-Prüfung','九合資管 VIP 私享安全認證'],
 bookedHint:['资金已划转，24 小时后发放第一笔收益','Funds transferred; first payout in 24 hours','資金を計上しました。24時間後に初回支払','자금 이체 완료, 24시간 후 첫 지급','Fonds transférés ; premier versement dans 24 h','Gelder übertragen; erste Auszahlung in 24 Stunden','資金已劃轉，24 小時後發放第一筆收益'],
 productLabel:['认购产品','Subscribed product','購入商品','구매 상품','Produit souscrit','Gezeichnetes Produkt','認購產品'],
 productTarget:['认购标的','Subscribed asset','購入対象','구매 대상','Actif souscrit','Gezeichnete Anlage','認購標的'],
 rateTerm:['日利率 / 周期','Daily rate / term','日利率 / 期間','일 이율 / 기간','Taux journalier / durée','Tageszins / Laufzeit','日利率 / 週期'],
 fullInterest:['到期预计总收益','Expected total interest at maturity','満期までの予想総利息','만기 예상 총 이자','Intérêts totaux estimés à échéance','Erwartete Gesamtzinsen bei Fälligkeit','到期預計總收益'],
 confirmReview:['请核对认购标的及扣款信息','Review the asset and debit details','購入対象と引落情報をご確認ください','구매 대상 및 차감 정보를 확인하세요','Vérifiez l’actif et les détails du débit','Anlage und Abbuchungsdetails prüfen','請核對認購標的及扣款資訊'],
 projectedDailyRate:['预期日利率','Expected daily rate','予想日利率','예상 일 이율','Taux journalier prévu','Erwarteter Tageszins','預期日利率'],
 sixDigitPin:['请输入 6 位数字支付密码确认授权','Enter your 6-digit payment PIN to authorize','6桁の支払いパスワードで承認してください','6자리 결제 비밀번호를 입력하여 승인하세요','Saisissez votre code de paiement à 6 chiffres','Mit dem sechsstelligen Zahlungscode bestätigen','請輸入 6 位數字支付密碼確認授權'],
 orderStatus:['订单状态','Order status','注文状況','주문 상태','Statut de la commande','Auftragsstatus','訂單狀態'],
 vipReview:['请核对 VIP 私享认购标的及扣款信息','Review the VIP product and debit details','VIP商品と引落情報をご確認ください','VIP 상품 및 차감 정보를 확인하세요','Vérifiez le produit VIP et le débit','VIP-Produkt und Abbuchung prüfen','請核對 VIP 私享認購標的及扣款資訊'],
} as const
const index:Record<Locale,number>={'zh-CN':0,en:1,ja:2,ko:3,fr:4,de:5,'zh-TW':6}
export function sourceText(locale:Locale,key:keyof typeof labels){return labels[key][index[locale]]}
export function sourcePayout(locale:Locale,mode:'daily'|'maturity',originalDailyCaption:string,translatedCaption:string){
 if(locale==='zh-CN')return mode==='maturity'?'到期返本返息':originalDailyCaption
 if(locale==='zh-TW')return mode==='maturity'?'到期返本返息':originalDailyCaption.replace(/时/g,'時')
 return translatedCaption
}
