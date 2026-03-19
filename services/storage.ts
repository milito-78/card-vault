import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SETUP_COMPLETE: 'setup_complete',
  SALT: 'salt',
  DATA_KEY_ENCRYPTED: 'data_key_encrypted',
  DATA_KEY_BIOMETRIC: 'data_key_biometric',
  CARDS_ENCRYPTED: 'cards_encrypted',
  AUTO_LOCK_TIMEOUT: 'auto_lock_timeout',
} as const;

export const AUTO_LOCK_OPTIONS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 0, label: 'Never' },
] as const;

const PREFIX = 'cardvault_';

// SecureStore doesn't work on web - use AsyncStorage fallback
const isWeb = Platform.OS === 'web';

async function getItem(key: string, secureOptions?: object): Promise<string | null> {
  if (isWeb) {
    return AsyncStorage.getItem(PREFIX + key);
  }
  if (secureOptions && 'requireAuthentication' in secureOptions) {
    return SecureStore.getItemAsync(key, secureOptions as any);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string, secureOptions?: object): Promise<void> {
  if (isWeb) {
    await AsyncStorage.setItem(PREFIX + key, value);
    return;
  }
  if (secureOptions && 'requireAuthentication' in secureOptions) {
    await SecureStore.setItemAsync(key, value, secureOptions as any);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    await AsyncStorage.removeItem(PREFIX + key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function isSetupComplete(): Promise<boolean> {
  const value = await getItem(KEYS.SETUP_COMPLETE);
  return value === 'true';
}

export async function setSetupComplete(): Promise<void> {
  await setItem(KEYS.SETUP_COMPLETE, 'true');
}

export async function getSalt(): Promise<string | null> {
  return getItem(KEYS.SALT);
}

export async function setSalt(salt: string): Promise<void> {
  await setItem(KEYS.SALT, salt);
}

export async function getDataKeyEncrypted(): Promise<string | null> {
  return getItem(KEYS.DATA_KEY_ENCRYPTED);
}

export async function setDataKeyEncrypted(value: string): Promise<void> {
  await setItem(KEYS.DATA_KEY_ENCRYPTED, value);
}

export async function getDataKeyBiometric(): Promise<string | null> {
  if (isWeb) return getItem(KEYS.DATA_KEY_BIOMETRIC); // No biometric on web
  return SecureStore.getItemAsync(KEYS.DATA_KEY_BIOMETRIC, {
    requireAuthentication: true,
    authenticationPrompt: 'Authenticate to unlock Card Vault',
  });
}

export async function setDataKeyBiometric(value: string): Promise<void> {
  if (isWeb) {
    await setItem(KEYS.DATA_KEY_BIOMETRIC, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(KEYS.DATA_KEY_BIOMETRIC, value, {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to save',
    });
  } catch {
    // Biometric storage optional
  }
}

export async function getCardsEncrypted(): Promise<string | null> {
  return getItem(KEYS.CARDS_ENCRYPTED);
}

export async function setCardsEncrypted(value: string): Promise<void> {
  await setItem(KEYS.CARDS_ENCRYPTED, value);
}

export async function clearDataKeyBiometric(): Promise<void> {
  await deleteItem(KEYS.DATA_KEY_BIOMETRIC);
}

export async function getAutoLockTimeout(): Promise<number> {
  const value = await getItem(KEYS.AUTO_LOCK_TIMEOUT);
  if (!value) return 60;
  const n = parseInt(value, 10);
  return isNaN(n) ? 60 : n;
}

export async function setAutoLockTimeout(seconds: number): Promise<void> {
  await setItem(KEYS.AUTO_LOCK_TIMEOUT, String(seconds));
}
