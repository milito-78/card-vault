/**
 * Storage service tests
 * Platform is mocked as 'ios' in setup, so storage uses SecureStore
 */

import * as storage from '@/services/storage';
import * as SecureStore from 'expo-secure-store';

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
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('true');
    const result = await storage.isSetupComplete();
    expect(result).toBe(true);
  });

  it('returns false when value is not "true"', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('false');
    const result = await storage.isSetupComplete();
    expect(result).toBe(false);
  });

  it('returns false when value is null', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    const result = await storage.isSetupComplete();
    expect(result).toBe(false);
  });
});

describe('setSetupComplete', () => {
  it('calls setItem with correct key', async () => {
    await storage.setSetupComplete();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('setup_complete', 'true');
  });
});

describe('getSalt', () => {
  it('returns salt from storage', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('abc123');
    const result = await storage.getSalt();
    expect(result).toBe('abc123');
  });

  it('returns null when not set', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    const result = await storage.getSalt();
    expect(result).toBeNull();
  });
});

describe('setSalt', () => {
  it('stores salt', async () => {
    await storage.setSalt('mysalt');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('salt', 'mysalt');
  });
});

describe('getDataKeyEncrypted', () => {
  it('returns encrypted key from storage', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('encryptedkey');
    const result = await storage.getDataKeyEncrypted();
    expect(result).toBe('encryptedkey');
  });
});

describe('setDataKeyEncrypted', () => {
  it('stores encrypted key', async () => {
    await storage.setDataKeyEncrypted('wrapped');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('data_key_encrypted', 'wrapped');
  });
});

describe('getCardsEncrypted', () => {
  it('returns encrypted cards from storage', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('encryptedcards');
    const result = await storage.getCardsEncrypted();
    expect(result).toBe('encryptedcards');
  });
});

describe('setCardsEncrypted', () => {
  it('stores encrypted cards', async () => {
    await storage.setCardsEncrypted('encrypted');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cards_encrypted', 'encrypted');
  });
});

describe('clearDataKeyBiometric', () => {
  it('removes biometric key', async () => {
    await storage.clearDataKeyBiometric();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('data_key_biometric');
  });
});

describe('getAutoLockTimeout', () => {
  it('returns default 60 when not set', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    const result = await storage.getAutoLockTimeout();
    expect(result).toBe(60);
  });

  it('returns stored value when valid', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('300');
    const result = await storage.getAutoLockTimeout();
    expect(result).toBe(300);
  });

  it('returns 60 when value is NaN', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('invalid');
    const result = await storage.getAutoLockTimeout();
    expect(result).toBe(60);
  });
});

describe('setAutoLockTimeout', () => {
  it('stores timeout value', async () => {
    await storage.setAutoLockTimeout(30);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auto_lock_timeout', '30');
  });
});

describe('getDataKeyBiometric (native)', () => {
  it('uses SecureStore with requireAuthentication', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('biokey');
    const result = await storage.getDataKeyBiometric();
    expect(result).toBe('biokey');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
      'data_key_biometric',
      expect.objectContaining({ requireAuthentication: true })
    );
  });
});

describe('setDataKeyBiometric (native)', () => {
  it('uses SecureStore with requireAuthentication', async () => {
    await storage.setDataKeyBiometric('key');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'data_key_biometric',
      'key',
      expect.objectContaining({ requireAuthentication: true })
    );
  });

  it('handles biometric storage failure gracefully', async () => {
    jest.mocked(SecureStore.setItemAsync).mockRejectedValue(new Error('biometric failed'));
    await expect(storage.setDataKeyBiometric('key')).resolves.not.toThrow();
  });
});
