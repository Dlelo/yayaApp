# Mobile Deployment Guide

End-to-end playbook for shipping the YayaConnect mobile app to **Google Play** and the **Apple App Store**. The same Angular + Capacitor 7 codebase produces both binaries.

## Contents

- [0 · One-time prep (both platforms)](#0--one-time-prep-both-platforms)
- [1 · Android → Google Play](#1--android--google-play)
- [2 · iOS → App Store](#2--ios--app-store)
- [Quick-reference release commands](#quick-reference-release-commands)
- [Common rejection reasons](#common-rejection-reasons)

---

## 0 · One-time prep (both platforms)

### 0.1 Generate icon + splash from your logo

Capacitor has an official tool that produces every required size from a single source.

```bash
cd yaya
npm i -D @capacitor/assets

mkdir -p resources
# Drop a 1024×1024 transparent PNG named icon.png into resources/
# Drop a 2732×2732 PNG named splash.png (centered logo on brand-color bg)
cp public/logo.png resources/icon.png    # if your logo is already 1024×1024
# Make a splash with cyan (#00ACC1) bg in any image tool, save to resources/splash.png

npx capacitor-assets generate --android --ios
```

This regenerates the per-density assets in `android/app/src/main/res/` and `ios/App/App/Assets.xcassets/`.

### 0.2 Set version + version code

Open `yaya/android/app/build.gradle` and bump on every release:

```gradle
versionCode 1        // integer; must increase every Play upload
versionName "1.0.0"  // user-facing
```

For iOS the equivalent is set in Xcode under **General → Identity** (Version + Build).

### 0.3 Confirm app metadata in `capacitor.config.ts`

Already set:

- `appId: 'com.yayaconnect.app'`
- `appName: 'YayaConnect'`

> ⚠️ The `appId` can never change after the first Play / App Store upload — pick carefully.

### 0.4 Set the production API URL

Edit `yaya/src/environments/environments.prod.ts` so the shipped app talks to the real backend:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yayaconnectapp.com/api',
  // …
};
```

### 0.5 Build the web bundle and sync

```bash
cd yaya
npm run build:mobile
npx cap sync
```

Run `cap sync` after **every** web change before opening Studio / Xcode.

---

## 1 · Android → Google Play

### 1.1 Open in Android Studio

```bash
cd yaya
npm run cap:open:android
```

First open: Android Studio runs Gradle sync. Confirm Android SDK 34 (or whatever your `compileSdkVersion` says) is installed via SDK Manager.

### 1.2 Create the upload keystore (one time per app)

```bash
cd yaya/android
keytool -genkey -v \
  -keystore release.keystore \
  -alias yayaconnect \
  -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ Save the keystore file + passwords somewhere durable. Losing them means you can't ship updates and have to publish a new app under a new ID.

### 1.3 Wire the keystore into the build

Create `yaya/android/keystore.properties` (gitignored):

```properties
storeFile=release.keystore
storePassword=<your store password>
keyAlias=yayaconnect
keyPassword=<your key password>
```

Add to `yaya/android/.gitignore`:

```
keystore.properties
*.keystore
```

In `yaya/android/app/build.gradle`, above `android { … }`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file("keystore.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android { … }`:

```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 1.4 Build a signed App Bundle (AAB — the format Play wants)

In Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle → release**.
The AAB lands at `yaya/android/app/build/outputs/bundle/release/app-release.aab`.

CLI alternative:

```bash
cd yaya/android
./gradlew bundleRelease
```

### 1.5 Play Console setup (one time)

1. **[Google Play Console](https://play.google.com/console)** → create developer account ($25 one-time).
2. **Create app** → fill name (`YayaConnect`), default language, app/game, free/paid.
3. **App content** (mandatory before any release):
   - Privacy policy URL → `https://yayaconnectapp.com/privacy-policy`
   - Data safety form (collect: account info, location, photos, payment via M-Pesa)
   - Target audience (likely 18+)
   - Permissions disclosure (camera if you upload IDs, location if you use pins)
4. **Store listing**: short description, full description, 2 screenshots minimum per device type, 512×512 icon, 1024×500 feature graphic.
5. **Closed testing track** (recommended first) → upload the AAB. After testing, promote to production.

### 1.6 Upload + roll out

Production → **Create new release** → upload `app-release.aab` → Save → Review → Start rollout.
First review usually takes 1–7 days; updates are typically same-day.

---

## 2 · iOS → App Store

### 2.1 Prerequisites you need to install

- macOS (you have this).
- Xcode 15+ from the Mac App Store.
- Command line tools: `xcode-select --install`.
- CocoaPods: `brew install cocoapods`.
- An **Apple Developer account** ($99/year — [developer.apple.com](https://developer.apple.com/programs/)). A personal Apple ID won't work for App Store distribution.

### 2.2 Add the iOS platform

```bash
cd yaya
npm run build:mobile
npm run cap:add:ios       # creates yaya/ios/
npx cap sync ios
npm run cap:open:ios      # opens Xcode
```

### 2.3 Configure in Xcode

Select the **App** target → **Signing & Capabilities** tab:

- **Team**: select your Apple Developer team.
- **Bundle Identifier**: `com.yayaconnect.app` (already set by Capacitor).
- **Automatically manage signing**: ✓ (Xcode handles cert + provisioning).

**General** tab:

- Display Name: `YayaConnect`
- Version: `1.0.0`
- Build: `1` (must increase on every upload)
- Deployment target: iOS 13.0 or higher (Capacitor 7 default).

**Info.plist** — add usage strings for any permissions you use. Even if Capacitor doesn't ask for them, App Review will reject builds that reference permission frameworks without descriptions:

```xml
<key>NSCameraUsageDescription</key>
<string>YayaConnect uses the camera to upload your national ID and profile photo.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Choose photos for your profile or document uploads.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Pin your home or current location to match with house helps near you.</string>
```

### 2.4 Register the app in App Store Connect

[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps → +** → New App → fill in:

- Name
- Primary language
- Bundle ID: `com.yayaconnect.app`
- SKU: `yayaconnect-ios`

Fill the **App Information**, **Pricing**, and **App Privacy** sections (similar disclosures to Play).

### 2.5 Archive + upload

In Xcode:

1. Top bar → device target → **Any iOS Device (arm64)**.
2. **Product → Archive**. Takes a few minutes.
3. Organizer opens automatically → select the archive → **Distribute App → App Store Connect → Upload**. Xcode handles signing and uploads to ASC.

### 2.6 TestFlight + submit for review

In App Store Connect → **TestFlight** tab → wait for the build to finish processing (~10 min) → add internal testers (yourself + team).

When ready: **App Store** tab → **+ Version → 1.0** → fill the listing (description, keywords, support URL, screenshots: required sizes 6.7", 6.5", 5.5") → attach the build → **Submit for Review**.

First review is typically 24–48 h; expect at least one rejection on the first submission, usually for missing screenshots, vague review notes, or missing demo credentials. Provide a test homeowner account in **App Review Information**.

---

## Quick-reference release commands

After signing is set up once, every subsequent release looks like this:

```bash
cd yaya

# 1. bump version
#    - capacitor.config.ts (optional)
#    - android/app/build.gradle (versionCode + versionName)
#    - Xcode General tab (Version + Build)

# 2. rebuild + sync web → native
npm run build:mobile
npx cap sync

# 3a. Android — produce signed AAB
cd android && ./gradlew bundleRelease
# upload android/app/build/outputs/bundle/release/app-release.aab to Play Console

# 3b. iOS — archive in Xcode
cd ..
npm run cap:open:ios
# Product → Archive → Distribute App → App Store Connect → Upload
```

---

## Common rejection reasons

- **Privacy policy not linked from the app** — `/privacy-policy` exists; make sure it's reachable from the in-app menu.
- **Backend down during review** — keep the prod API up while review is running. App Review tests the live build.
- **Demo account missing** — both stores want a working test login. Create `apple-review@yayaconnectapp.com` and `play-review@yayaconnectapp.com` with seeded data and put credentials in the review notes.
- **Permissions overreach** — don't include `NSLocationAlwaysUsageDescription` if you only need when-in-use. Apple will reject.
- **In-app payments via Web** — if your M-Pesa flow is for digital goods / subscriptions, Apple may demand IAP. Physical service payment (paying a house help) is exempt; document this in review notes if asked.
- **Crashes on launch** — always test the AAB / TestFlight build on a real device before promoting to production.

---

## Help

When you're ready to go live and want help with screenshot generation, store listing copy, or wiring deep-links so reset/OTP links open the app, ping the team.
