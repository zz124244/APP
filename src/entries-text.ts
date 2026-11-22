import type {Locale} from './i18n'
const text={
 mall_redemption:['商城兑换','Mall redemption','モール交換','몰 교환','Échange boutique','Shop-Einlösung','商城兌換'],
 mall_refund:['商城退款','Mall refund','モール返金','몰 환불','Remboursement boutique','Shop-Erstattung','商城退款'],
 checkin:['签到奖励','Check-in reward','チェックイン報酬','출석 보상','Prime de présence','Anmeldebonus','簽到獎勵'],
 registration_bonus:['注册奖励','Registration bonus','登録ボーナス','가입 보너스',"Prime d'inscription",'Registrierungsbonus','註冊獎勵'],
 lottery_cash:['USDT中奖','USDT prize','USDT当選','USDT 당첨','Gain USDT','USDT-Gewinn','USDT中獎'],
 lottery_mobile:['手机中奖','Phone prize','電話賞品当選','휴대폰 당첨','Téléphone gagné','Telefongewinn','手機中獎'],
 physical:['实物奖品','Physical prize','実物賞品','실물 상품','Lot matériel','Sachpreis','實物獎品'],
 task_reward:['任务奖励','Task reward','タスク報酬','미션 보상','Récompense de mission','Aufgabenprämie','任務獎勵'],
 daily_dividend:['全球分红','Global dividend','グローバル配当','글로벌 배당','Dividende mondial','Globale Dividende','全球分紅'],
 title:['资金明细','Transactions','資金明細','자금 내역','Transactions','Transaktionen','資金明細'],
 empty:['暂无资金记录','No transactions yet','資金記録はありません','자금 내역 없음','Aucune transaction','Noch keine Transaktionen','暫無資金記錄'],
 refresh:['刷新记录','Refresh history','履歴を更新','내역 새로고침','Actualiser l’historique','Verlauf aktualisieren','重新整理記錄'],
 deposit:['充值入账','Deposit credited','入金反映','충전 입금','Dépôt crédité','Einzahlung gutgeschrieben','充值入賬'],
 recharge_points:['充值积分','Deposit points','入金ポイント','충전 포인트','Points de dépôt','Einzahlungspunkte','充值積分'],
 investment_points:['购买积分','Purchase points','購入ポイント','구매 포인트','Points d’achat','Kaufpunkte','購買積分'],
 investment_purchase:['产品申购','Product purchase','商品購入','상품 구매','Souscription','Produktkauf','產品申購'],
 investment_principal:['本金返还','Principal returned','元本返還','원금 반환','Capital restitué','Kapitalrückzahlung','本金返還'],
 investment_interest:['利息发放','Interest paid','利息支払','이자 지급','Intérêts versés','Zinsgutschrift','利息發放'],
 referral_award:['推荐奖励','Referral reward','紹介報酬','추천 보상','Prime de parrainage','Empfehlungsprämie','推薦獎勵'],
 transfer_in:['用户转入','Transfer received','送金受取','이체 수취','Transfert reçu','Transfer erhalten','用戶轉入'],
 transfer_out:['用户转出','Transfer sent','送金支出','이체 송금','Transfert envoyé','Transfer gesendet','用戶轉出'],
 wallet_rollover:['转入可用 · 余额移动','Moved to available · Balance movement','利用可能残高へ移動・残高移動','사용 잔액으로 이동 · 잔액 이동','Vers le disponible · Mouvement de solde','In verfügbares Guthaben · Guthabenverschiebung','轉入可用 · 餘額移動'],
 account_freeze:['账户冻结 · 余额移动','Account frozen · Balance movement','口座凍結・残高移動','계정 동결 · 잔액 이동','Compte gelé · Mouvement de solde','Konto gesperrt · Guthabenverschiebung','賬戶凍結 · 餘額移動'],
 account_unfreeze:['账户解冻 · 余额移动','Account unfrozen · Balance movement','口座凍結解除・残高移動','계정 동결 해제 · 잔액 이동','Compte dégelé · Mouvement de solde','Konto entsperrt · Guthabenverschiebung','賬戶解凍 · 餘額移動'],
 withdrawal_hold:['提现冻结 · 余额移动','Withdrawal reserved · Balance movement','出金用凍結・残高移動','출금 동결 · 잔액 이동','Retrait réservé · Mouvement de solde','Auszahlung reserviert · Guthabenverschiebung','提現凍結 · 餘額移動'],
 withdrawal_release:['提现解冻 · 余额移动','Withdrawal released · Balance movement','出金凍結解除・残高移動','출금 동결 해제 · 잔액 이동','Retrait libéré · Mouvement de solde','Auszahlung freigegeben · Guthabenverschiebung','提現解凍 · 餘額移動'],
 withdrawal_complete:['提现扣款','Withdrawal debited','出金引落','출금 차감','Retrait débité','Auszahlung abgebucht','提現扣款'],
 other:['其他账务变动','Other account activity','その他の口座変動','기타 계정 변동','Autre mouvement de compte','Sonstige Kontobewegung','其他賬務變動'],
 other_movement:['余额移动','Balance movement','残高移動','잔액 이동','Mouvement de solde','Guthabenverschiebung','餘額移動'],
 cursor_invalid:['记录游标已失效，请刷新记录。','History cursor is invalid. Refresh history.','履歴カーソルが無効です。履歴を更新してください。','내역 커서가 유효하지 않습니다. 새로고침하세요.','Curseur invalide. Actualisez l’historique.','Ungültiger Verlaufscursor. Verlauf aktualisieren.','記錄游標已失效，請重新整理記錄。'],
 motto:['长期 · 专注 · 利他','Long term · Focus · Altruism','長期・集中・利他','장기 · 집중 · 이타','Long terme · Concentration · Altruisme','Langfristigkeit · Fokus · Gemeinsinn','長期 · 專注 · 利他']
} as const
export type EntriesTextKey=keyof typeof text
const index:Record<Locale,number>={'zh-CN':0,en:1,ja:2,ko:3,fr:4,de:5,'zh-TW':6}
export function entriesText(locale:Locale,key:EntriesTextKey){return text[key][index[locale]]}
