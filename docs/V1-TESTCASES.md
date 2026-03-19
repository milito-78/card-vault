# Card Vault V1 – Test Cases

**Version:** 1.0  
**Last Updated:** March 2025

---

## Test Environment

- **Platforms:** iOS (physical device), Android (physical device)
- **Expo Go:** Development builds only (biometric may require dev build)
- **Network:** Offline (airplane mode)

---

## 1. Authentication & Setup

### TC-AUTH-001: First Launch – Onboarding
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fresh install, launch app | Onboarding / PIN setup screen shown |
| 2 | Tap "Get Started" or equivalent | PIN creation screen shown |
| 3 | Enter 6-digit PIN (e.g. 123456) | PIN accepted |
| 4 | Enter PIN again to confirm | Setup completes, app unlocks |
| 5 | App shows card list (empty) | No errors |

### TC-AUTH-002: PIN Mismatch on Setup
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On setup, enter PIN "123456" | First field filled |
| 2 | Enter different PIN "654321" for confirm | Error: "PINs do not match" |
| 3 | Setup does not complete | User can retry |

### TC-AUTH-003: PIN Too Short
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On setup, enter 4-digit PIN | Validation error or PIN rejected |
| 2 | Message: "PIN must be at least 6 digits" | User can correct |

### TC-AUTH-004: Biometric Unlock (when enrolled)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete setup with biometric enabled | Biometric prompt shown on next launch |
| 2 | Launch app (locked state) | Biometric prompt appears |
| 3 | Authenticate with Face ID / fingerprint | App unlocks, card list shown |
| 4 | No PIN required | Success |

### TC-AUTH-005: Biometric Cancel – Fallback to PIN
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | App locked, biometric prompt shown | User taps "Cancel" |
| 2 | PIN screen shown | User can enter PIN |
| 3 | Enter correct PIN | App unlocks |

### TC-AUTH-006: PIN Unlock
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | App locked (or biometric unavailable) | PIN screen shown |
| 2 | Enter correct PIN | App unlocks |
| 3 | Card list displayed | Data intact |

### TC-AUTH-007: Wrong PIN
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | App locked, PIN screen shown | Enter wrong PIN |
| 2 | Error message shown | App stays locked |
| 3 | User can retry | No data exposed |

### TC-AUTH-008: Auto-Lock
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Unlock app, view card list | App unlocked |
| 2 | Send app to background (e.g. 60s timeout) | Wait for auto-lock timeout |
| 3 | Return to app | Lock screen shown |
| 4 | Unlock with PIN or biometric | App unlocks, data visible |

---

## 2. Card Management

### TC-CARD-001: Add Card
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap "Add Card" | Add card form shown |
| 2 | Fill: Bank "Test Bank", Number "4111111111111111", CVV "123", Exp "12/28", Password "test123" | All fields accept input |
| 3 | Tap Save | Card saved, list shown |
| 4 | New card appears in list | Bank name, masked number (•••• 1111), expiry visible |

### TC-CARD-002: Add Card – Validation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open Add Card form | Form shown |
| 2 | Leave required fields empty, tap Save | Validation errors shown |
| 3 | Enter invalid expiry (e.g. 13/99) | Error or rejection |
| 4 | Correct and save | Card saved |

### TC-CARD-003: View Card List
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add 2–3 cards | Cards in list |
| 2 | View list | Each card shows: bank name, masked number, expiry |
| 3 | No full card number or CVV visible | Sensitive data masked |
| 4 | Tap a card | Card detail screen opens |

### TC-CARD-004: View Card Detail – Tap to Reveal
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open card detail | All fields masked by default |
| 2 | Tap "Reveal" on card number | Full number shown |
| 3 | Tap "Reveal" on CVV | CVV shown |
| 4 | Tap "Reveal" on password | Password shown |
| 5 | Tap "Hide" or blur again | Fields masked again |

### TC-CARD-005: Edit Card
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open card detail | Card data shown |
| 2 | Tap Edit | Edit form with current values |
| 3 | Change bank name to "Updated Bank" | Field updated |
| 4 | Save | Changes persisted |
| 5 | Reopen card | "Updated Bank" shown |

### TC-CARD-006: Delete Card
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open card detail | Card shown |
| 2 | Tap Delete | Confirmation dialog |
| 3 | Confirm delete | Card removed from list |
| 4 | Card list updated | Deleted card no longer visible |
| 5 | Cancel in dialog | Card not deleted |

### TC-CARD-007: Copy Card Number
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open card detail, reveal card number | Full number visible |
| 2 | Tap "Copy" | Toast/feedback: "Copied" |
| 3 | Paste in another app | Correct number pasted |
| 4 | Wait 30–60 seconds | Clipboard cleared (if implemented) |

---

## 3. Security & Data

### TC-SEC-001: Data Encrypted at Rest
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add a card | Card saved |
| 2 | Inspect device storage (if possible) or use debug logs | No plaintext card number, CVV, or password in storage |
| 3 | SecureStore / Keychain contains only encrypted data or keys | Pass |

### TC-SEC-002: Persistence After App Restart
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add 2 cards, unlock app | Cards visible |
| 2 | Force close app | App closed |
| 3 | Reopen app | Lock screen shown |
| 4 | Unlock with PIN or biometric | Same 2 cards visible |
| 5 | Data unchanged | Pass |

### TC-SEC-003: No Data After Uninstall (Android)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Add cards, then uninstall app | App removed |
| 2 | Reinstall app | Fresh install |
| 3 | Onboarding shown | No previous data |
| 4 | Must set up PIN again | Pass |

### TC-SEC-004: Offline Operation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable airplane mode | No network |
| 2 | Use app: add, view, edit, delete cards | All operations work |
| 3 | No network errors | App fully offline |

---

## 4. UI/UX

### TC-UI-001: Dark Theme
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app | Dark background, light text |
| 2 | All screens use dark theme | Consistent appearance |

### TC-UI-002: Empty State
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fresh app, no cards | Empty state message |
| 2 | Clear "Add your first card" or similar | CTA to add card |
| 3 | Tap CTA | Add card form opens |

### TC-UI-003: Navigation
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | From list, tap card | Detail opens |
| 2 | Tap back | Returns to list |
| 3 | From list, tap Add | Add form opens |
| 4 | Save or cancel | Returns to list |
| 5 | Settings accessible | Settings screen opens |

---

## 5. Edge Cases & Error Handling

### TC-ERR-001: Biometric Unavailable
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use device without biometrics (or simulator) | PIN screen shown |
| 2 | No biometric prompt | App works with PIN only |

### TC-ERR-002: Biometric Changed (iOS)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | After changing device biometrics | `data_key_biometric` may be invalidated |
| 2 | PIN unlock still works | User can access data |
| 3 | Re-enroll biometric if desired | Biometric can be set up again |

### TC-ERR-003: Rapid Lock/Unlock
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Unlock app | App unlocked |
| 2 | Immediately lock (or auto-lock) | Lock screen |
| 3 | Unlock again | No crash, data visible |

---

## Test Summary

| Category | Test Count | Priority |
|----------|------------|----------|
| Authentication & Setup | 8 | P0 |
| Card Management | 7 | P0 |
| Security & Data | 4 | P0 |
| UI/UX | 3 | P1 |
| Edge Cases | 3 | P1 |
| **Total** | **25** | |

---

## Pass/Fail Tracking

Use this table to track results:

| ID | Pass | Fail | Notes |
|----|------|------|-------|
| TC-AUTH-001 | ☐ | ☐ | |
| TC-AUTH-002 | ☐ | ☐ | |
| TC-AUTH-003 | ☐ | ☐ | |
| TC-AUTH-004 | ☐ | ☐ | |
| TC-AUTH-005 | ☐ | ☐ | |
| TC-AUTH-006 | ☐ | ☐ | |
| TC-AUTH-007 | ☐ | ☐ | |
| TC-AUTH-008 | ☐ | ☐ | |
| TC-CARD-001 | ☐ | ☐ | |
| TC-CARD-002 | ☐ | ☐ | |
| TC-CARD-003 | ☐ | ☐ | |
| TC-CARD-004 | ☐ | ☐ | |
| TC-CARD-005 | ☐ | ☐ | |
| TC-CARD-006 | ☐ | ☐ | |
| TC-CARD-007 | ☐ | ☐ | |
| TC-SEC-001 | ☐ | ☐ | |
| TC-SEC-002 | ☐ | ☐ | |
| TC-SEC-003 | ☐ | ☐ | |
| TC-SEC-004 | ☐ | ☐ | |
| TC-UI-001 | ☐ | ☐ | |
| TC-UI-002 | ☐ | ☐ | |
| TC-UI-003 | ☐ | ☐ | |
| TC-ERR-001 | ☐ | ☐ | |
| TC-ERR-002 | ☐ | ☐ | |
| TC-ERR-003 | ☐ | ☐ | |
