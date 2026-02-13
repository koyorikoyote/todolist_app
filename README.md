# Secure TODO App

A cross-platform TODO list application with biometric authentication and encrypted storage built with React Native and Expo.

## Core Features

- Biometric authentication (Face ID, Touch ID, Fingerprint) with PIN fallback
- AES-256 encrypted local storage (iOS Keychain, Android KeyStore, Web encrypted localStorage)
- Swipe gestures for quick TODO deletion
- Cross-platform support (iOS, Android, Web)
- Offline-first architecture with automatic data persistence

## Tech Stack

- **Expo SDK 54** with React Native 0.81.5 and React 19.1.0
- **Zustand v5** for state management
- **Expo Router v6** for file-based navigation
- **expo-local-authentication** for biometric/PIN auth
- **expo-secure-store** for encrypted storage (iOS/Android)
- **expo-crypto** for web encryption fallback
- **TypeScript 5.9** with strict mode

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application in an Android emulator:
   ```bash
   npm run android
   ```


## Testing

Run the test suite:
```bash
npm run test
```

Run linting:
```bash
npx eslint .
```

## First Launch

On first launch, the app creates three sample TODO items to demonstrate functionality. Authenticate with biometrics or your device PIN to access the TODO list.

Setting a device PIN on an Android emulator:
```bash
adb shell locksettings set-pin 1234
```