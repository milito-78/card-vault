/**
 * TC-SEC: Security & Data tests
 * Based on V1-TESTCASES.md - encryption/decryption
 */

import {
  deriveKeyFromPin,
  generateSalt,
  encryptData,
  decryptData,
  wrapKey,
  unwrapKey,
} from '@/services/encryption';
import { AESEncryptionKey, aesEncryptAsync, aesDecryptAsync, AESSealedData } from 'expo-crypto';

describe('deriveKeyFromPin', () => {
  it('TC-SEC-001: derives consistent key from same PIN and salt', async () => {
    const salt = 'a'.repeat(64); // 32 bytes hex
    const key1 = await deriveKeyFromPin('123456', salt);
    const key2 = await deriveKeyFromPin('123456', salt);
    expect(key1).toEqual(key2);
  });

  it('derives different keys for different PINs', async () => {
    const salt = 'a'.repeat(64);
    const key1 = await deriveKeyFromPin('123456', salt);
    const key2 = await deriveKeyFromPin('654321', salt);
    expect(key1).not.toEqual(key2);
  });

  it('derives different keys for different salts', async () => {
    const key1 = await deriveKeyFromPin('123456', 'a'.repeat(64));
    const key2 = await deriveKeyFromPin('123456', 'b'.repeat(64));
    expect(key1).not.toEqual(key2);
  });

  it('produces 32-byte key', async () => {
    const salt = 'a'.repeat(64);
    const key = await deriveKeyFromPin('123456', salt);
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(32);
  });
});

describe('generateSalt', () => {
  it('generates 64-char hex string (32 bytes)', async () => {
    const salt = await generateSalt();
    expect(salt).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates salt with correct format', async () => {
    const salt = await generateSalt();
    expect(salt).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('encryptData', () => {
  it('encrypts plaintext and returns base64', async () => {
    const mockSealed = { combined: jest.fn().mockResolvedValue('encryptedbase64') };
    jest.mocked(aesEncryptAsync).mockResolvedValue(mockSealed as any);
    const mockKey = {} as AESEncryptionKey;
    const result = await encryptData('plaintext', mockKey);
    expect(result).toBe('encryptedbase64');
    expect(aesEncryptAsync).toHaveBeenCalled();
  });
});

describe('decryptData', () => {
  it('decrypts ciphertext and returns plaintext', async () => {
    const mockSealed = {} as AESSealedData;
    jest.mocked(AESSealedData.fromCombined).mockReturnValue(mockSealed);
    jest.mocked(aesDecryptAsync).mockResolvedValue('cGxhaW50ZXh0'); // base64 of plaintext
    const mockKey = {} as AESEncryptionKey;
    const result = await decryptData('cipherbase64', mockKey);
    expect(result).toBeDefined();
    expect(aesDecryptAsync).toHaveBeenCalled();
  });
});

describe('wrapKey', () => {
  it('wraps data key with PIN-derived key', async () => {
    const mockDataKey = { encoded: jest.fn().mockResolvedValue('hexkey') } as any;
    const mockKek = {} as AESEncryptionKey;
    const mockSealed = { combined: jest.fn().mockResolvedValue('wrapped') };
    jest.mocked(AESEncryptionKey.import).mockResolvedValue(mockKek);
    jest.mocked(aesEncryptAsync).mockResolvedValue(mockSealed as any);
    const wrappingKey = new Uint8Array(32).fill(1);
    const result = await wrapKey(mockDataKey, wrappingKey);
    expect(result).toBe('wrapped');
  });
});

describe('unwrapKey', () => {
  it('unwraps and returns AESEncryptionKey', async () => {
    const mockKey = {} as AESEncryptionKey;
    jest.mocked(aesDecryptAsync).mockResolvedValue('aGV4a2V5'); // base64 of 'hexkey'
    jest.mocked(AESEncryptionKey.import).mockResolvedValue(mockKey);
    const wrappingKey = new Uint8Array(32).fill(1);
    const result = await unwrapKey('wrapped', wrappingKey);
    expect(result).toBe(mockKey);
    expect(AESEncryptionKey.import).toHaveBeenCalled();
  });
});
