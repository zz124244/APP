import type {Locale} from './i18n'
const labels:Record<Locale,[string,string,string,string,string]>={
 'zh-CN':['当前登录可用，但未能安全保存登录状态；关闭应用后可能需要重新登录。','无法清除本机登录记录，请联网退出后再清理应用数据。','正在核对登录状态','无法核对登录状态，请检查网络后重试。','重试'],
 'zh-TW':['目前登入可用，但未能安全儲存登入狀態；關閉應用後可能需要重新登入。','無法清除本機登入紀錄，請連網登出後再清理應用資料。','正在核對登入狀態','無法核對登入狀態，請檢查網路後重試。','重試'],
 en:['Signed in, but secure session storage failed. You may need to sign in after closing the app.','Could not remove the saved session. Sign out online before clearing app data.','Checking your session','Cannot verify your session. Check your connection and retry.','Retry'],
 ja:['ログイン中ですが安全な保存に失敗しました。終了後は再ログインが必要な場合があります。','保存したログイン情報を削除できません。オンラインでログアウト後、アプリデータを消去してください。','ログイン状態を確認中','ログインを確認できません。接続を確認し再試行してください。','再試行'],
 ko:['로그인했지만 안전한 저장에 실패했습니다. 앱을 닫은 후 다시 로그인해야 할 수 있습니다.','저장된 로그인을 지울 수 없습니다. 온라인에서 로그아웃한 후 앱 데이터를 지우세요.','로그인 확인 중','로그인을 확인할 수 없습니다. 연결 확인 후 다시 시도하세요.','재시도'],
 fr:['Connexion active, mais son stockage sécurisé a échoué. Une reconnexion peut être nécessaire après fermeture.','Impossible de supprimer la session enregistrée. Déconnectez-vous en ligne avant d’effacer les données.','Vérification de la session','Session impossible à vérifier. Vérifiez la connexion et réessayez.','Réessayer'],
 de:['Angemeldet, aber sicheres Speichern fehlgeschlagen. Nach dem Schließen kann eine neue Anmeldung nötig sein.','Gespeicherte Sitzung konnte nicht gelöscht werden. Vor dem Löschen der App-Daten online abmelden.','Sitzung wird geprüft','Sitzung nicht überprüfbar. Verbindung prüfen und erneut versuchen.','Erneut versuchen']
}
export const sessionText=(locale:Locale,index:0|1|2|3|4)=>labels[locale][index]
