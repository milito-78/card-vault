/**
 * TC-SEC: Security & Data tests
 * Based on V1-TESTCASES.md - encryption/decryption
 */

import { deriveKeyFromPin, generateSalt } from '@/services/encryption';

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
