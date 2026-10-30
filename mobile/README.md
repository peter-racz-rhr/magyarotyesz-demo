# magyarotyesz for Android (standalone app)

This is the Android app. It is a **Capacitor** app: it shows the website (https://project-1y1mw.vercel.app) in its
**own** WebView, so it does not need Chrome, never says "Running in Chrome", and draws edge to edge (the map goes
behind the status bar and the gesture bar). Every screen still comes from the website, so when the website is
updated, the app is updated the next time it opens. A new APK is only needed when something in this folder changes.

Inside the app:
- **Google sign-in** uses Android's own account sheet (Google blocks its web sign-in inside apps).
- **Location** uses Android's own permission prompt.
- The status bar icons follow the app's light/dark look.

(`../android-twa/` is the older Chrome-based version. It is kept for reference; use this one.)

## 1. One-time setup on your PC

1. Install **Node.js LTS** from https://nodejs.org (the big green button; keep the default options).
2. Open a terminal in this `mobile` folder (in File Explorer: open the folder, type `cmd` in the address bar, Enter) and run:
   ```
   npm install
   ```
   This downloads Capacitor and the Google sign-in plugin and prepares `android/` (about a minute).
   Run it again whenever you download a newer version of this folder.

## 2. Build the APK

1. Android Studio > **Open** > choose `mobile/android` (this folder's `android`, **not** `android-twa`).
2. Let it sync (accept SDK/Gradle updates it offers).
3. **Build > Generate App Bundles or APKs > Generate APKs**.
4. The file is `mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Install it on the phone.
   It replaces the older Chrome-based app (same package, higher version).

## 3. Google sign-in in the app (one time, in Google Cloud)

Android's sign-in needs to know which app may use your Google login:

1. Get the **SHA-1** of the key that signs the APK: in Android Studio's **Terminal** (in `mobile/android`) run
   `.\gradlew signingReport` and copy the `SHA1:` line of `Variant: debug`.
2. Google Cloud Console > **Google Auth Platform > Clients > Create client** > Application type **Android**:
   - Package name: `hu.magyarotyesz.app`
   - SHA-1 certificate fingerprint: the SHA-1 from step 1
3. Create. Nothing to copy: the app keeps using the **Web** client id (the server already knows it).

Later, for your release key and for Google Play's signing key, add one more Android client each (same package, that
key's SHA-1).

## 4. A release build (for Google Play or to share)

1. Build > **Generate Signed App Bundle or APK** > create a new keystore the first time. Save the `.jks` file and both
   passwords somewhere safe; **if you lose the key you can never update the app**.
2. Optional: copy `android/keystore.properties.example` to `android/keystore.properties`, fill it in, and release builds
   are signed automatically.
3. For every new upload raise `versionCode` (and `versionName`) in `android/app/build.gradle`.

## If something is off

- **Google sign-in says "Developer console is not set up correctly"**: the SHA-1 or package name in step 3 doesn't match
  the APK you installed (each PC's debug key is different).
- **Black bars at the top/bottom**: the phone's Android System WebView is old; update it in the Play Store.
- **"Could not find :capacitor-android"** while syncing: run `npm install` in `mobile` first (step 1).
