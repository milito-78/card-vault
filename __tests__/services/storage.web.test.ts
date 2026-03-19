/**
 * Storage service tests - Web platform (AsyncStorage path)
 */

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

import * as storage from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('storage (web)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('isSetupComplete uses AsyncStorage', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('true');
    const result = await storage.isSetupComplete();
    expect(result).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('cardvault_setup_complete');
  });

  it('setSetupComplete uses AsyncStorage', async () => {
    await storage.setSetupComplete();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_setup_complete', 'true');
  });

  it('getSalt uses AsyncStorage', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('salt');
    const result = await storage.getSalt();
    expect(result).toBe('salt');
  });

  it('setSalt uses AsyncStorage', async () => {
    await storage.setSalt('mysalt');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_salt', 'mysalt');
  });

  it('getDataKeyEncrypted uses AsyncStorage', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('encrypted');
    const result = await storage.getDataKeyEncrypted();
    expect(result).toBe('encrypted');
  });

  it('setDataKeyEncrypted uses AsyncStorage', async () => {
    await storage.setDataKeyEncrypted('wrapped');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_data_key_encrypted', 'wrapped');
  });

  it('getDataKeyBiometric uses AsyncStorage on web', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('biokey');
    const result = await storage.getDataKeyBiometric();
    expect(result).toBe('biokey');
  });

  it('setDataKeyBiometric uses AsyncStorage on web', async () => {
    await storage.setDataKeyBiometric('key');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_data_key_biometric', 'key');
  });

  it('getCardsEncrypted uses AsyncStorage', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('cards');
    const result = await storage.getCardsEncrypted();
    expect(result).toBe('cards');
  });

  it('setCardsEncrypted uses AsyncStorage', async () => {
    await storage.setCardsEncrypted('enc');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_cards_encrypted', 'enc');
  });

  it('clearDataKeyBiometric uses AsyncStorage', async () => {
    await storage.clearDataKeyBiometric();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cardvault_data_key_biometric');
  });

  it('getAutoLockTimeout uses AsyncStorage', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValue('300');
    const result = await storage.getAutoLockTimeout();
    expect(result).toBe(300);
  });

  it('setAutoLockTimeout uses AsyncStorage', async () => {
    await storage.setAutoLockTimeout(30);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('cardvault_auto_lock_timeout', '30');
  });
});
