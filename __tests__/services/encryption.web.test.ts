/**
 * Encryption tests - Web platform (Web Crypto API path)
 */

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

// Mock crypto.subtle for Node test environment
const mockEncrypt = jest.fn();
const mockDecrypt = jest.fn();
const mockImportKey = jest.fn();
const mockGetRandomValues = jest.fn();

global.crypto = {
  subtle: {
    importKey: mockImportKey,
    encrypt: mockEncrypt,
    decrypt: mockDecrypt,
  },
  getRandomValues: mockGetRandomValues,
} as any;

import { wrapKey, unwrapKey } from '@/services/encryption';
import { AESEncryptionKey } from 'expo-crypto';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = 1;
    return arr;
  });
  mockImportKey.mockResolvedValue({});
});

describe('wrapKey (web)', () => {
  it('wraps key using Web Crypto API', async () => {
    const mockDataKey = { encoded: jest.fn().mockResolvedValue('a'.repeat(64)) } as any;
    mockEncrypt.mockResolvedValue(new ArrayBuffer(48));
    const wrappingKey = new Uint8Array(32).fill(1);
    const result = await wrapKey(mockDataKey, wrappingKey);
    expect(result).toBeDefined();
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockEncrypt).toHaveBeenCalled();
  });
});

describe('unwrapKey (web)', () => {
  it('unwraps key using Web Crypto API', async () => {
    const mockKey = {} as AESEncryptionKey;
    jest.mocked(AESEncryptionKey.import).mockResolvedValue(mockKey);
    const hexKey = 'a'.repeat(64);
    const base64OfHex = Buffer.from(hexKey).toString('base64');
    mockDecrypt.mockResolvedValue(new TextEncoder().encode(base64OfHex).buffer);
    const wrappingKey = new Uint8Array(32).fill(1);
    const combined = new Uint8Array(12 + 32);
    combined.fill(1);
    const wrapped = Buffer.from(combined).toString('base64');
    const result = await unwrapKey(wrapped, wrappingKey);
    expect(result).toBe(mockKey);
    expect(mockDecrypt).toHaveBeenCalled();
  });
});
