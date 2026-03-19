# Card Vault

A secure mobile app for storing your debit and credit card information. Card Vault encrypts your data and protects access with PIN and biometric authentication (Face ID / fingerprint).

## What It Does

- **Secure storage** — Card details (number, CVV2, expiry, password) are encrypted with AES-256-GCM
- **Biometric unlock** — Use Face ID or fingerprint to unlock quickly
- **PIN fallback** — Unlock with a 6-digit PIN when biometrics aren't available
- **Tap-to-reveal** — Sensitive fields stay masked until you tap to show them
- **Copy with auto-clear** — Copy card numbers to clipboard; they clear automatically after a short time
- **Auto-lock** — App locks when you switch away for added security

## Tech Stack

- [Expo](https://expo.dev) (React Native)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind](https://www.nativewind.dev) (Tailwind CSS)
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) for encrypted storage
- [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) for biometrics

## Getting Started

```bash
cd card-vault
npm install
npm start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS).

### Development

```bash
npm run android   # Run on Android
npm run ios       # Run on iOS
npm run web       # Run in browser
npm test          # Run tests
```

### Production Build

```bash
eas build --profile production
```

Builds run on [Expo Application Services](https://expo.dev). Use `--platform android` or `--platform ios` for a single platform.

## Project Structure

```
card/
├── card-vault/          # Main Expo app
│   ├── app/             # Routes (auth, tabs, card screens)
│   ├── components/
│   ├── services/        # encryption, storage, auth, cards
│   └── assets/
└── docs/                # Planning and documentation
```

## License

MIT License. See [LICENSE](LICENSE) for details.
