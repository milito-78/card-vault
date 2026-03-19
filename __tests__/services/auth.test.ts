/**
 * Auth service tests
 */

import * as auth from '@/services/auth';
import * as storage from '@/services/storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { AESEncryptionKey } from 'expo-crypto';

jest.mock('@/services/storage', () => ({
  getSalt: jest.fn(),
  setSalt: jest.fn(),
  getDataKeyEncrypted: jest.fn(),
  setDataKeyEncrypted: jest.fn(),
  getDataKeyBiometric: jest.fn(),
  setDataKeyBiometric: jest.fn(),
  setSetupComplete: jest.fn(),
  isSetupComplete: jest.fn(),
}));

jest.mock('@/services/encryption', () => {
  const mockKey = { encoded: jest.fn().mockResolvedValue('hexkey') };
  return {
    deriveKeyFromPin: jest.fn().mockResolvedValue(new Uint8Array(32).fill(1)),
    generateSalt: jest.fn().mockResolvedValue('a'.repeat(64)),
    wrapKey: jest.fn().mockResolvedValue('wrapped'),
    unwrapKey: jest.fn().mockResolvedValue(mockKey),
  };
});

jest.mock('expo-crypto', () => {
  const mockKey = { encoded: jest.fn().mockResolvedValue('hexkey') };
  return {
    AESEncryptionKey: {
      generate: jest.fn().mockResolvedValue(mockKey),
      import: jest.fn().mockResolvedValue(mockKey),
    },
  };
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

beforeEach(() => {
  auth.lock();
  jest.clearAllMocks();
});

describe('isUnlocked', () => {
  it('returns false when locked', () => {
    expect(auth.isUnlocked()).toBe(false);
  });

  it('returns true when unlocked', async () => {
    jest.mocked(storage.getSalt).mockResolvedValue('salt');
    jest.mocked(storage.getDataKeyEncrypted).mockResolvedValue('wrapped');
    await auth.unlockWithPin('123456');
    expect(auth.isUnlocked()).toBe(true);
  });
});

describe('getDataKey', () => {
  it('returns null when locked', () => {
    expect(auth.getDataKey()).toBeNull();
  });
});

describe('lock', () => {
  it('clears in-memory key', async () => {
    jest.mocked(storage.getSalt).mockResolvedValue('salt');
    jest.mocked(storage.getDataKeyEncrypted).mockResolvedValue('wrapped');
    await auth.unlockWithPin('123456');
    expect(auth.isUnlocked()).toBe(true);
    auth.lock();
    expect(auth.isUnlocked()).toBe(false);
  });
});

describe('isSetupComplete', () => {
  it('delegates to storage', async () => {
    jest.mocked(storage.isSetupComplete).mockResolvedValue(true);
    const result = await auth.isSetupComplete();
    expect(result).toBe(true);
  });
});

describe('hasBiometricHardware', () => {
  it('delegates to LocalAuthentication', async () => {
    jest.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
    const result = await auth.hasBiometricHardware();
    expect(result).toBe(true);
  });
});

describe('isBiometricEnrolled', () => {
  it('delegates to LocalAuthentication', async () => {
    jest.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
    const result = await auth.isBiometricEnrolled();
    expect(result).toBe(true);
  });
});

describe('canUseBiometric', () => {
  it('returns true when hardware and enrolled', async () => {
    jest.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(true);
    jest.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
    const result = await auth.canUseBiometric();
    expect(result).toBe(true);
  });

  it('returns false when no hardware', async () => {
    jest.mocked(LocalAuthentication.hasHardwareAsync).mockResolvedValue(false);
    jest.mocked(LocalAuthentication.isEnrolledAsync).mockResolvedValue(true);
    const result = await auth.canUseBiometric();
    expect(result).toBe(false);
  });
});

describe('setupPin', () => {
  it('sets up PIN and unlocks', async () => {
    await auth.setupPin('123456');
    expect(storage.setSalt).toHaveBeenCalled();
    expect(storage.setDataKeyEncrypted).toHaveBeenCalledWith('wrapped');
    expect(storage.setSetupComplete).toHaveBeenCalled();
    expect(auth.isUnlocked()).toBe(true);
  });
});

describe('unlockWithPin', () => {
  it('returns false when no salt', async () => {
    jest.mocked(storage.getSalt).mockResolvedValue(null);
    const result = await auth.unlockWithPin('123456');
    expect(result).toBe(false);
  });

  it('returns false when no wrapped key', async () => {
    jest.mocked(storage.getSalt).mockResolvedValue('salt');
    jest.mocked(storage.getDataKeyEncrypted).mockResolvedValue(null);
    const result = await auth.unlockWithPin('123456');
    expect(result).toBe(false);
  });

  it('returns true and unlocks when PIN correct', async () => {
    jest.mocked(storage.getSalt).mockResolvedValue('salt');
    jest.mocked(storage.getDataKeyEncrypted).mockResolvedValue('wrapped');
    const result = await auth.unlockWithPin('123456');
    expect(result).toBe(true);
    expect(auth.isUnlocked()).toBe(true);
  });

  it('returns false when unwrap fails', async () => {
    const { unwrapKey } = require('@/services/encryption');
    jest.mocked(storage.getSalt).mockResolvedValue('salt');
    jest.mocked(storage.getDataKeyEncrypted).mockResolvedValue('wrapped');
    unwrapKey.mockRejectedValueOnce(new Error('wrong pin'));
    const result = await auth.unlockWithPin('wrong');
    expect(result).toBe(false);
  });
});

describe('unlockWithBiometric', () => {
  it('returns false when auth fails', async () => {
    jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({ success: false } as any);
    const result = await auth.unlockWithBiometric();
    expect(result).toBe(false);
  });

  it('returns false when no biometric key stored', async () => {
    jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({ success: true } as any);
    jest.mocked(storage.getDataKeyBiometric).mockResolvedValue(null);
    const result = await auth.unlockWithBiometric();
    expect(result).toBe(false);
  });

  it('returns true and unlocks when successful', async () => {
    jest.mocked(LocalAuthentication.authenticateAsync).mockResolvedValue({ success: true } as any);
    jest.mocked(storage.getDataKeyBiometric).mockResolvedValue('hexkey');
    const result = await auth.unlockWithBiometric();
    expect(result).toBe(true);
    expect(auth.isUnlocked()).toBe(true);
  });
});

describe('changePin', () => {
  it('returns false when not unlocked', async () => {
    const result = await auth.changePin('123456', '654321');
    expect(result).toBe(false);
  });

  it('returns true and updates when successful', async () => {
    jest.mocked(storage.getSalt).mockResolvedValue('a'.repeat(64));
    jest.mocked(storage.getDataKeyEncrypted).mockResolvedValue('wrapped');
    await auth.unlockWithPin('123456');

    const result = await auth.changePin('123456', '654321');
    expect(result).toBe(true);
    expect(storage.setSalt).toHaveBeenCalled();
    expect(storage.setDataKeyEncrypted).toHaveBeenCalled();
  });

  it('returns false when current PIN wrong', async () => {
    jest.mocked(storage.getSalt).mockResolvedValue('salt');
    jest.mocked(storage.getDataKeyEncrypted).mockResolvedValue('wrapped');
    await auth.unlockWithPin('123456');

    const { unwrapKey } = require('@/services/encryption');
    unwrapKey.mockRejectedValueOnce(new Error('wrong'));

    const result = await auth.changePin('wrong', '654321');
    expect(result).toBe(false);
  });
});
