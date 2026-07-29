# Implementation Plan: Converting LocalPulseMobile to an Android App (Expo SDK 54)

This plan outlines the steps to finalize the Android configuration for the current Expo project and provides a guide for building and running the app on Android devices.

## User Review Required

> [!IMPORTANT]
> A unique Android package name is required. I will use `com.localpulse.mobile` as a default. Please let me know if you would like to change this.

## Proposed Changes

### [Expo Configuration]

#### [MODIFY] [app.json](file:///C:/Users/Jeevitha/OneDrive/Desktop/vs_supabase/local_pulse_workspace/LocalPulseMobile/app.json)
- Add the `android.package` field to identify the app on Android devices and the Play Store.

#### [NEW] [eas.json](file:///C:/Users/Jeevitha/OneDrive/Desktop/vs_supabase/local_pulse_workspace/LocalPulseMobile/eas.json)
- Create a configuration file for EAS (Expo Application Services) to enable building standalone APKs (for testing) and AABs (for the Play Store).

---

## Step-by-Step Guide for User

### 1. Development (Expo Go)
- Install the **Expo Go** app from the Google Play Store on your Android device.
- Run `npm run android` in your terminal.
- Scan the QR code with the Expo Go app (or a QR scanner).

### 2. Building an APK (For Manual Testing)
- Install EAS CLI: `npm install -g eas-cli`.
- Login to Expo: `eas login`.
- Run the build: `eas build -p android --profile preview`.
- This will generate a link to download the `.apk` file that you can install directly on your phone.

### 3. Building an AAB (For Play Store)
- Run `eas build -p android --profile production`.
- This generates the `.aab` file required by Google Play.

## Verification Plan

### Automated Tests
- Run `npx expo lint` (if configured) or check `app.json` for schema validity.

### Manual Verification
- Verify that `eas build --help` works (requires EAS CLI installed globally).
- Confirm that the Android package name is correctly reflected in the modified `app.json`.
