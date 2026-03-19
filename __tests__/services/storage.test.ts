/**
 * Storage service tests
 */

import * as storage from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('AUTO_LOCK_OPTIONS', () => {
  it('exports expected options', () => {
    expect(storage.AUTO_LOCK_OPTIONS).toHaveLength(4);
    expect(storage.AUTO_LOCK_OPTIONS[0]).toEqual({ value: 30, label: '30 seconds' });
    expect(storage.AUTO_LOCK_OPTIONS[1]).toEqual({ value: 60, label: '1 minute' });
  });
});

describe('isSetupComplete', () => {
  it('returns true when value is "true"', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('true');
    const result = await storage.isSetupComplete();
    expect(result).toBe(true);
  });

  it('returns false when value is not "true"', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('false');
    const result = await storage.isSetupComplete();
    expect(result).toBe(false);
  });

  it('returns false when value is null', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const result = await storage.isSetupComplete();
    expect(result).toBe(false);
  });
});

describe('setSetupComplete', () => {
  it('calls setItem with correct key', async () => {
    await storage.setSetupComplete();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_setup_complete', 'true');
  });
});

describe('getSalt', () => {
  it('returns salt from storage', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('abc123');
    const result = await storage.getSalt();
    expect(result).toBe('abc123');
  });

  it('returns null when not set', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const result = await storage.getSalt();
    expect(result).toBeNull();
  });
});

describe('setSalt', () => {
  it('stores salt', async () => {
    await storage.setSalt('mysalt');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_salt', 'mysalt');
  });
});

describe('getDataKeyEncrypted', () => {
  it('returns encrypted key from storage', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('encryptedkey');
    const result = await storage.getDataKeyEncrypted();
    expect(result).toBe('encryptedkey');
  });
});

describe('setDataKeyEncrypted', () => {
  it('stores encrypted key', async () => {
    await storage.setDataKeyEncrypted('wrapped');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_data_key_encrypted', 'wrapped');
  });
});

describe('getCardsEncrypted', () => {
  it('returns encrypted cards from storage', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('encryptedcards');
    const result = await storage.getCardsEncrypted();
    expect(result).toBe('encryptedcards');
  });
});

describe('setCardsEncrypted', () => {
  it('stores encrypted cards', async () => {
    await storage.setCardsEncrypted('encrypted');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_cards_encrypted', 'encrypted');
  });
});

describe('clearDataKeyBiometric', () => {
  it('removes biometric key', async () => {
    await storage.clearDataKeyBiometric();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cardvault_data_key_biometric');
  });
});

describe('getAutoLockTimeout', () => {
  it('returns default 60 when not set', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const result = await storage.getAutoLockTimeout();
    expect(result).toBe(60);
  });

  it('returns stored value when valid', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('300');
    const result = await storage.getAutoLockTimeout();
    expect(result).toBe(300);
  });

  it('returns 60 when value is NaN', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('invalid');
    const result = await storage.getAutoLockTimeout();
    expect(result).toBe(60);
  });
});

describe('setAutoLockTimeout', () => {
  it('stores timeout value', async () => {
    await storage.setAutoLockTimeout(30);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_auto_lock_timeout', '30');
  });
});
