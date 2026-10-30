# Superseded

This is the older Chrome-based (Trusted Web Activity) app. The standalone app is in `../mobile/` (see its README).

# magyarotyesz for Android (APK / Play Store)

This folder is an Android Studio project. The app is a thin shell (a **Trusted Web Activity**) that opens the website
full screen, with no browser bar, its own icon, splash screen, launcher shortcuts (Nearest, Urgent, Saved) and the phone's
location and notification permissions. **All screens come from the website**, so when the website is updated, everyone's
app is updated the next time it opens, with nothing to install. You only make a new APK when the *shell* changes (rare).

It needs Chrome (or another Trusted Web Activity browser) on the phone, which every Android phone has.

## 1. Open it

1. Android Studio > **Open** > choose this `android` folder (not "Import").
2. Let it sync. If it offers to upgrade the Android Gradle Plugin, Gradle or the SDK, accept (it only helps).
   If it asks to install an SDK platform (API 35), accept.
3. Settings are in `gradle.properties`:
   - `MAGYAR_HOST`: the website address without `https://` (now `project-1y1mw.vercel.app`)
   - `MAGYAR_PACKAGE`: the app's id (`hu.magyarotyesz.app`). **Never change it after publishing.**
   - `MAGYAR_VERSION_CODE` / `MAGYAR_VERSION_NAME`: raise the code by 1 for every new build you share or upload.

## 2. Try it on your phone (debug APK)

- Plug in the phone (USB debugging on) and press Run, **or** Build > Build Bundle(s) / APK(s) > Build APK(s). The file is
  `app/build/outputs/apk/debug/app-debug.apk`; send it to your phone and open it.

## 3. Make the address bar disappear (Digital Asset Links)

Until the website says "this app may open me as itself", the app shows a thin browser bar. To fix that:

1. Get the SHA-256 fingerprint of the key that signed the app:
   - debug key: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
     (on Windows: `%USERPROFILE%\.android\debug.keystore`)
   - your release key: `keytool -list -v -keystore my-release-key.jks -alias <alias>`
   - Google Play's own signing key (after the first upload): Play Console > Test and release > App integrity > App signing.
2. In the Vercel project (Settings > Environment Variables), set
   - `ANDROID_PACKAGE_NAME` = `hu.magyarotyesz.app`
   - `ANDROID_SHA256_FINGERPRINTS` = all the fingerprints you use, separated by commas (colons inside each, like `AB:CD:...`)
3. Redeploy the website, then open `https://project-1y1mw.vercel.app/.well-known/assetlinks.json`: it must show your package.
4. On the phone: clear Chrome's data (or reinstall the app) once, then open the app: no bar.

## 4. A release you can keep updating

1. Build > **Generate Signed App Bundle / APK**. Pick **APK** for sharing directly, or **Android App Bundle** for Google Play.
2. First time: **Create new** keystore. Save the `.jks` file and both passwords somewhere safe (a password manager, plus a
   copy off your PC). **If you lose the key you can never update the app.** Never commit it (`.gitignore` already blocks `*.jks`).
3. Update later: raise `MAGYAR_VERSION_CODE`, build again with **the same key**. An APK installs over the old one
   (same key + higher code = an update that keeps the user's data). On Google Play, upload the new `.aab`.
4. Optional, so you do not click through the dialog each time: copy `keystore.properties.example` to `keystore.properties`,
   fill it in, and `./gradlew assembleRelease` signs automatically (`app/build/outputs/apk/release/`).

## 5. Google Play

See `../docs/play-store.md` (store texts, forms, the 12-testers closed test). Upload the signed `.aab`, add Google's signing
fingerprint to `ANDROID_SHA256_FINGERPRINTS` (step 3), and keep the one from your own key too if you also share APKs.

## If something is off

- **A browser bar shows at the top:** the fingerprint list is wrong, or Chrome still has the old answer cached (step 3.4).
- **Location or notifications do nothing:** check the app's permissions in Android settings; Android asks the first time.
- **Gradle cannot find a dependency version:** raise or lower the version number in `app/build.gradle`
  (`androidbrowserhelper`, `locationdelegation`); Android Studio underlines versions it knows are newer.
- **Google Play wants a newer target API:** raise `compileSdk` and `targetSdk` in `app/build.gradle` and rebuild.
- **Moving to your own domain:** change `MAGYAR_HOST`, update `ANDROID_SHA256_FINGERPRINTS` on the new site, and publish a new version.
