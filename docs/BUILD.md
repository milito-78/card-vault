# Card Vault – Build & Run

## Build APK for Android

### Prerequisites

- Node.js installed
- Expo account ([expo.dev](https://expo.dev))

### Steps

1. **Install EAS CLI** (one-time)
   ```bash
   npm install -g eas-cli
   ```
   Or use without global install:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```

2. **Log in to Expo** (one-time)
   ```bash
   eas login
   ```
   Create an account if prompted.

3. **Build the APK**
   ```bash
   cd card-vault
   eas build --platform android --profile preview
   ```

4. **Wait for build** (~10–20 min)
   - Build runs in the cloud
   - You'll get a download link when done
   - Download the APK and install on your Android device

### Build Profiles

| Profile      | Output | Use case              |
|-------------|--------|------------------------|
| `preview`   | APK    | Testing on device      |
| `production`| AAB    | Play Store submission  |

### Troubleshooting

- **"Not logged in"** → Run `eas login`
- **"Project not configured"** → Run `eas build:configure` first
- **Build fails** → Check [expo.dev/build](https://expo.dev/build) for logs
