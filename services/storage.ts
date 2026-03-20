import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugLog, debugLogError } from './debugLog';

const KEYS = {
  SETUP_COMPLETE: 'setup_complete',
  SALT: 'salt',
  DATA_KEY_ENCRYPTED: 'data_key_encrypted',
  DATA_KEY_BIOMETRIC: 'data_key_biometric',
  CARDS_ENCRYPTED: 'cards_encrypted',
  AUTO_LOCK_TIMEOUT: 'auto_lock_timeout',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  SORT_BY: 'sort_by',
  SORT_ORDER: 'sort_order',
  LOCALE: 'locale',
} as const;

export type SortBy = 'bankName' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

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
  const options =
    Platform.OS === 'ios'
      ? { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }
      : undefined;
  return SecureStore.getItemAsync(key, options);
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
  const options =
    Platform.OS === 'ios'
      ? { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }
      : undefined;
  await SecureStore.setItemAsync(key, value, options);
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
  // No requireAuthentication - we already authenticated via LocalAuthentication
  // before calling this. Avoids double fingerprint prompt.
  const options =
    Platform.OS === 'ios'
      ? { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }
      : undefined;
  return SecureStore.getItemAsync(KEYS.DATA_KEY_BIOMETRIC, options);
}

export async function setDataKeyBiometric(value: string): Promise<void> {
  if (isWeb) {
    await setItem(KEYS.DATA_KEY_BIOMETRIC, value);
    return;
  }
  try {
    // No requireAuthentication - user already passed setup. Avoids double prompt
    const options =
      Platform.OS === 'ios'
        ? { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }
        : undefined;
    await SecureStore.setItemAsync(KEYS.DATA_KEY_BIOMETRIC, value, options);
  } catch {
    // Biometric storage optional
  }
}

export async function getCardsEncrypted(): Promise<string | null> {
  try {
    const v = await getItem(KEYS.CARDS_ENCRYPTED);
    debugLog('getCardsEncrypted: key=', KEYS.CARDS_ENCRYPTED, 'platform=', Platform.OS, 'len=', v?.length ?? 0);
    return v;
  } catch (e) {
    debugLogError('getCardsEncrypted', e);
    throw e;
  }
}

export async function setCardsEncrypted(value: string): Promise<void> {
  debugLog('setCardsEncrypted: key=', KEYS.CARDS_ENCRYPTED, 'platform=', Platform.OS, 'len=', value.length);
  try {
    await setItem(KEYS.CARDS_ENCRYPTED, value);
    debugLog('setCardsEncrypted: write ok');
  } catch (e) {
    debugLogError('setCardsEncrypted', e);
    throw e;
  }
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

export async function getBiometricEnabled(): Promise<boolean> {
  const value = await getItem(KEYS.BIOMETRIC_ENABLED);
  if (value === null) return true; // default enabled for existing users
  return value === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await setItem(KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
}

export async function getSortPreference(): Promise<{
  sortBy: SortBy;
  sortOrder: SortOrder;
}> {
  const sortBy = (await getItem(KEYS.SORT_BY)) as SortBy | null;
  const sortOrder = (await getItem(KEYS.SORT_ORDER)) as SortOrder | null;
  return {
    sortBy: sortBy === 'bankName' || sortBy === 'createdAt' ? sortBy : 'createdAt',
    sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc',
  };
}

export async function setSortPreference(
  sortBy: SortBy,
  sortOrder: SortOrder
): Promise<void> {
  await setItem(KEYS.SORT_BY, sortBy);
  await setItem(KEYS.SORT_ORDER, sortOrder);
}

export type Locale = 'en' | 'ar' | 'fa';

export async function getLocale(): Promise<Locale | null> {
  const value = await getItem(KEYS.LOCALE);
  return value === 'en' || value === 'ar' || value === 'fa' ? value : null;
}

export async function setLocale(locale: Locale): Promise<void> {
  await setItem(KEYS.LOCALE, locale);
}
