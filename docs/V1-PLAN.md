# Card Vault – V1 Plan & Implementation Steps

**Version:** 1.0  
**Last Updated:** March 2025

---

## Overview

This document outlines the V1 scope, implementation steps, and phases for the Card Vault app.

---

## V1 Scope Summary

| Category | Features |
|----------|----------|
| **Auth** | PIN setup, biometric unlock, PIN fallback, auto-lock |
| **Cards** | Add, view, edit, delete cards |
| **Data** | Bank name, card number, CVV2, expiry, password |
| **Security** | AES-256-GCM encryption, PBKDF2 key derivation, SecureStore |
| **UI** | Dark theme, NativewindUI components, tap-to-reveal |

---

## Phase 1: Foundation (Week 1)

### Step 1.1: Project Setup
- [ ] Create Expo project with Expo Router template
- [ ] Install NativeWind and configure Tailwind
- [ ] Install NativewindUI and add required components
- [ ] Configure `app.json` for SecureStore and LocalAuthentication (Face ID permission)

### Step 1.2: Dependencies
```bash
npx create-expo-app@latest card-vault --template tabs
cd card-vault
npx expo install expo-secure-store expo-local-authentication expo-crypto
npm install nativewind tailwindcss
# Add NativewindUI per their docs
```

### Step 1.3: Encryption Service
- [ ] Create `services/encryption.ts`
- [ ] Implement PBKDF2 key derivation (use `react-native-expo-crypto` or equivalent)
- [ ] Implement AES-GCM encrypt/decrypt using `expo-crypto`
- [ ] Handle salt generation and storage

### Step 1.4: Storage Service
- [ ] Create `services/storage.ts`
- [ ] Implement SecureStore wrappers for: `setup_complete`, `salt`, `data_key_encrypted`, `data_key_biometric`, `cards_encrypted`
- [ ] Implement read/write with proper options (`requireAuthentication` for biometric key)

### Step 1.5: Auth Service
- [ ] Create `services/auth.ts`
- [ ] Implement `isSetupComplete()`, `setupPin(pin)`, `unlockWithBiometric()`, `unlockWithPin(pin)`
- [ ] Implement `lock()` to clear in-memory keys
- [ ] Integrate with encryption and storage services

### Step 1.6: Lock Screen UI
- [ ] Create `app/(auth)/index.tsx` – lock screen
- [ ] Create `app/(auth)/setup.tsx` – first-time PIN setup
- [ ] Implement PIN input component (6 digits)
- [ ] Implement biometric prompt on app launch
- [ ] Route: show setup if not complete, else show lock, else show app

### Step 1.7: Root Layout & Auth Guard
- [ ] Create `app/(auth)/_layout.tsx`
- [ ] Implement auth state (locked/unlocked/setup)
- [ ] Protect main app routes when locked

---

## Phase 2: Core Features (Week 2)

### Step 2.1: Card Service
- [ ] Create `services/cards.ts`
- [ ] Implement `getCards()`, `addCard()`, `updateCard()`, `deleteCard()`
- [ ] All operations go through auth service (decrypted key in memory)

### Step 2.2: Card List Screen
- [ ] Create `app/(tabs)/index.tsx`
- [ ] Display cards: bank name, masked number (•••• 1234), expiry
- [ ] Empty state when no cards
- [ ] Navigate to card detail on tap
- [ ] FAB or header button to add card

### Step 2.3: Card Detail Screen
- [ ] Create `app/card/[id].tsx`
- [ ] Show all fields with tap-to-reveal for sensitive data
- [ ] Copy button for card number (with auto-clear)
- [ ] Edit and Delete actions

### Step 2.4: Add/Edit Card Form
- [ ] Create `app/card/add.tsx`
- [ ] Form: bank name, card number, CVV2, expiry (MM/YY), password
- [ ] Validation (card number format, expiry format)
- [ ] Reuse form for edit in `app/card/[id].tsx`

### Step 2.5: Data Model
- [ ] Define `Card` interface (id, bankName, cardNumber, cvv2, expDate, password, createdAt)
- [ ] Use UUID for card IDs

---

## Phase 3: Polish (Week 3)

### Step 3.1: Auto-Lock
- [ ] Use `AppState` to detect background
- [ ] Start timer when app goes to background
- [ ] Lock app when timer expires (e.g. 60 seconds)
- [ ] Clear decrypted data from memory on lock

### Step 3.2: Copy with Auto-Clear
- [ ] Copy to clipboard on button press
- [ ] Clear clipboard after 30–60 seconds (timer)
- [ ] Show toast/feedback when copied

### Step 3.3: Search
- [ ] Add search input to card list
- [ ] Filter by bank name or last 4 digits

### Step 3.4: Change PIN
- [ ] Create settings screen or section
- [ ] Require current PIN
- [ ] New PIN + confirm
- [ ] Re-encrypt `data_key_encrypted` with new PIN-derived key
- [ ] Update `data_key_biometric` if needed

### Step 3.5: Settings Screen
- [ ] Create `app/(tabs)/settings.tsx`
- [ ] Auto-lock timeout options (30s, 60s, 5min, never)
- [ ] Change PIN
- [ ] App info / version

---

## Phase 4: Release (Week 4)

### Step 4.1: EAS Build
- [ ] Configure `eas.json` for development and production
- [ ] Run `eas build --platform ios` and `eas build --platform android`
- [ ] Test builds on physical devices

### Step 4.2: App Store Prep
- [ ] App icon (1024x1024)
- [ ] Screenshots for store listing
- [ ] Privacy policy (if required)
- [ ] App description

### Step 4.3: Final Testing
- [ ] Test on iOS and Android
- [ ] Test biometric + PIN flows
- [ ] Test encryption/decryption
- [ ] Test auto-lock

---

## File Structure (Target)

```
card-vault/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Lock screen
│   │   └── setup.tsx        # PIN setup
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Card list
│   │   └── settings.tsx
│   ├── card/
│   │   ├── [id].tsx
│   │   └── add.tsx
│   └── _layout.tsx
├── components/
├── services/
│   ├── encryption.ts
│   ├── storage.ts
│   ├── auth.ts
│   └── cards.ts
├── docs/
│   ├── V1-PLAN.md
│   └── V1-TESTCASES.md
└── package.json
```

---

## Next Steps After V1

| Step | Description |
|------|-------------|
| V1.1 | Bug fixes and UX improvements based on testing |
| V2 | Optional: Encrypted backup/export to file |
| V2 | Optional: Sort by bank name / date added |
| V2 | Optional: RTL / i18n support |
| V2 | Optional: Widget for quick access (platform-dependent) |
