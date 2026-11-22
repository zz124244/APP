import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var privacyCover: UIView?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        guard privacyCover == nil, let window = window else { return }
        let cover = UIView(frame: window.bounds)
        cover.backgroundColor = .systemBackground
        cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(cover)
        privacyCover = cover
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        privacyCover?.removeFromSuperview()
        privacyCover = nil
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}


import Security
@objc(SecureSessionPlugin)
public class SecureSessionPlugin: CAPPlugin, CAPBridgedPlugin {
 public let identifier="SecureSessionPlugin"
 public let jsName="SecureSession"
 public let pluginMethods:[CAPPluginMethod]=[CAPPluginMethod(name:"get",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"set",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"remove",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"info",returnType:CAPPluginReturnPromise),CAPPluginMethod(name:"openDownload",returnType:CAPPluginReturnPromise)]
 private func query(_ key:String)->[String:Any]{[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:(Bundle.main.bundleIdentifier ?? "app")+".session",kSecAttrAccount as String:key]}
 public override func load(){if !UserDefaults.standard.bool(forKey:"secure_installation_initialized"){for key in ["auth","installation"]{SecItemDelete(query(key) as CFDictionary)};UserDefaults.standard.set(true,forKey:"secure_installation_initialized")}}
 private func key(_ call:CAPPluginCall)->String?{guard let key=call.getString("key"),["auth","installation"].contains(key) else {call.reject("invalid_key");return nil};return key}
 @objc func get(_ call:CAPPluginCall){guard let key=key(call) else{return};var q=query(key);q[kSecReturnData as String]=true;q[kSecMatchLimit as String]=kSecMatchLimitOne;var result:CFTypeRef?;let status=SecItemCopyMatching(q as CFDictionary,&result);if status==errSecItemNotFound{call.resolve(["value":NSNull()]);return};guard status==errSecSuccess,let data=result as? Data,let value=String(data:data,encoding:.utf8) else{call.reject("secure_storage_unavailable");return};call.resolve(["value":value])}
 @objc func set(_ call:CAPPluginCall){guard let key=key(call) else{return};guard let value=call.getString("value"),value.utf8.count<=8192 else{call.reject("invalid_value");return};let values:[String:Any]=[kSecValueData as String:Data(value.utf8),kSecAttrAccessible as String:kSecAttrAccessibleWhenUnlockedThisDeviceOnly];let q=query(key);var status=SecItemUpdate(q as CFDictionary,values as CFDictionary);if status==errSecItemNotFound{status=SecItemAdd(q.merging(values){_,new in new} as CFDictionary,nil)};guard status==errSecSuccess else{call.reject("secure_storage_unavailable");return};call.resolve()}
 @objc func remove(_ call:CAPPluginCall){guard let key=key(call) else{return};let status=SecItemDelete(query(key) as CFDictionary);guard status==errSecSuccess||status==errSecItemNotFound else{call.reject("secure_storage_unavailable");return};call.resolve()}
 @objc func info(_ call:CAPPluginCall){guard let build=Int(Bundle.main.object(forInfoDictionaryKey:"CFBundleVersion") as? String ?? ""),let version=Bundle.main.object(forInfoDictionaryKey:"CFBundleShortVersionString") as? String else{call.reject("version_unavailable");return};call.resolve(["platform":"ios","build":build,"version":version])}
 @objc func openDownload(_ call:CAPPluginCall){guard let raw=call.getString("url"),let url=URL(string:raw),url.scheme=="https",url.host != nil,url.path=="/web/download",url.user==nil else{call.reject("invalid_url");return};DispatchQueue.main.async{UIApplication.shared.open(url,options:[:]){ok in if ok{call.resolve()}else{call.reject("download_unavailable")}}}}
}
@objc(AppBridgeViewController)
class AppBridgeViewController:CAPBridgeViewController {
 override func capacitorDidLoad(){
  super.capacitorDidLoad()
  if let webView = webView {
   let scrollView = webView.scrollView
   scrollView.minimumZoomScale = 1
   scrollView.maximumZoomScale = 1
   scrollView.zoomScale = 1
   scrollView.bouncesZoom = false
   scrollView.bounces = false
   scrollView.alwaysBounceHorizontal = false
   scrollView.directionalLockEnabled = true
  }
  bridge?.registerPluginInstance(SecureSessionPlugin())
 }
}
