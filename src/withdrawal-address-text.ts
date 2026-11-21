import type {Locale} from './i18n'
const words={
 'zh-CN':['提现地址','每个网络最多保存 3 个地址，仅用于提现时快速填入，不改变提现校验规则。','保存地址','输入或粘贴地址','暂无地址','删除','确认删除该地址？','该网络已保存 3 个地址，请先删除一个','该地址已保存','地址格式不正确','选择地址','网络异常，请稍后重试'],
 en:['Withdrawal addresses','Up to 3 addresses per network. They only prefill the withdrawal form and do not change any withdrawal check.','Save address','Enter or paste an address','No addresses saved','Delete','Delete this address?','This network already has 3 addresses. Delete one first.','This address is already saved','Invalid address format','Choose address','Network error. Please try again.'],
 ja:['出金先アドレス','ネットワークごとに最大3件まで保存できます。出金フォームの入力を補助するだけで、出金の審査ルールは変わりません。','アドレスを保存','アドレスを入力または貼り付け','保存済みのアドレスはありません','削除','このアドレスを削除しますか？','このネットワークはすでに3件保存されています。先に1件削除してください','このアドレスは保存済みです','アドレスの形式が正しくありません','アドレスを選択','通信エラーです。しばらくしてから再試行してください'],
 ko:['출금 주소','네트워크당 최대 3개까지 저장됩니다. 출금 입력을 돕는 용도이며 출금 심사 규칙은 바뀌지 않습니다.','주소 저장','주소를 입력하거나 붙여넣기','저장된 주소가 없습니다','삭제','이 주소를 삭제할까요?','이 네트워크에는 이미 3개가 저장되어 있습니다. 먼저 하나를 삭제하세요','이미 저장된 주소입니다','주소 형식이 올바르지 않습니다','주소 선택','네트워크 오류입니다. 잠시 후 다시 시도하세요'],
 fr:['Adresses de retrait','Jusqu’à 3 adresses par réseau. Elles ne préremplissent que le formulaire de retrait et ne modifient aucun contrôle.','Enregistrer l’adresse','Saisissez ou collez une adresse','Aucune adresse enregistrée','Supprimer','Supprimer cette adresse ?','Ce réseau a déjà 3 adresses. Supprimez-en une d’abord.','Cette adresse est déjà enregistrée','Format d’adresse invalide','Choisir une adresse','Erreur réseau. Veuillez réessayer.'],
 de:['Auszahlungsadressen','Bis zu 3 Adressen pro Netzwerk. Sie füllen nur das Auszahlungsformular vor und ändern keine Prüfregel.','Adresse speichern','Adresse eingeben oder einfügen','Noch keine Adresse gespeichert','Löschen','Diese Adresse löschen?','Dieses Netzwerk hat bereits 3 Adressen. Bitte zuerst eine löschen.','Diese Adresse ist bereits gespeichert','Ungültiges Adressformat','Adresse wählen','Netzwerkfehler. Bitte erneut versuchen.'],
 'zh-TW':['提現地址','每個網路最多儲存 3 個地址，僅用於提現時快速填入，不改變提現校驗規則。','儲存地址','輸入或貼上地址','尚無地址','刪除','確認刪除此地址？','該網路已儲存 3 個地址，請先刪除一個','該地址已儲存','地址格式不正確','選擇地址','網路異常，請稍後重試']
} satisfies Record<Locale,string[]>
export const withdrawalAddressKeys=['title','hint','add','placeholder','empty','remove','confirmRemove','limit','duplicate','invalid','choose','error'] as const
export type WithdrawalAddressTextKey=typeof withdrawalAddressKeys[number]
export function withdrawalAddressText(locale:Locale,key:WithdrawalAddressTextKey){return words[locale][withdrawalAddressKeys.indexOf(key)]!}
