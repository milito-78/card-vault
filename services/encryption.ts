import { Platform } from 'react-native';
import {
  AESEncryptionKey,
  aesEncryptAsync,
  aesDecryptAsync,
  AESSealedData,
  getRandomBytesAsync,
} from 'expo-crypto';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha2';
import base64 from 'base-64';

const isWeb = Platform.OS === 'web';

// unescape/escape may not exist in Hermes - use polyfill for UTF-8 safe base64
const unescapePolyfill = (str: string) =>
  str.replace(/%([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
// For base64 decoded binary string: each char is a byte (0-255)
const escapePolyfill = (str: string) =>
  str.replace(/./g, (c) =>
    '%' + c.charCodeAt(0).toString(16).padStart(2, '0')
  );

const toBase64 = (str: string) =>
  base64.encode(unescapePolyfill(encodeURIComponent(str)));
const fromBase64 = (str: string) =>
  decodeURIComponent(escapePolyfill(base64.decode(str)));

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 32;

/**
 * Derive a 256-bit key from PIN using PBKDF2 (pure JS - works with EAS Build)
 */
export async function deriveKeyFromPin(
  pin: string,
  saltHex: string
): Promise<Uint8Array> {
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const password = new TextEncoder().encode(pin);
  return pbkdf2(sha256, password, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_LENGTH,
  });
}

/**
 * Generate a random salt for PBKDF2
 */
export async function generateSalt(): Promise<string> {
  const bytes = await getRandomBytesAsync(SALT_LENGTH);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Encrypt plaintext with AES-256-GCM
 */
export async function encryptData(
  plaintext: string,
  key: AESEncryptionKey
): Promise<string> {
  const plaintextBase64 = toBase64(plaintext);
  const sealedData = await aesEncryptAsync(plaintextBase64, key);
  const combined = await sealedData.combined('base64');
  return combined;
}

/**
 * Decrypt ciphertext with AES-256-GCM
 */
export async function decryptData(
  ciphertextBase64: string,
  key: AESEncryptionKey
): Promise<string> {
  const sealedData = AESSealedData.fromCombined(ciphertextBase64);
  const decryptedBase64 = await aesDecryptAsync(sealedData, key, {
    output: 'base64',
  });
  return fromBase64(decryptedBase64);
}

const IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;

// Binary base64 (IV+ciphertext+tag) - use btoa/atob on web
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function base64ToBytes(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Web-only: wrap key using Web Crypto API (avoids expo-crypto module issues)
 */
async function wrapKeyWeb(
  keyHex: string,
  wrappingKey: Uint8Array
): Promise<string> {
  const kek = await crypto.subtle.importKey(
    'raw',
    wrappingKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const plaintext = toBase64(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertextWithTag = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: GCM_TAG_LENGTH * 8 },
    kek,
    new TextEncoder().encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + ciphertextWithTag.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertextWithTag), iv.length);
  return bytesToBase64(combined);
}

/**
 * Web-only: unwrap key using Web Crypto API
 */
async function unwrapKeyWeb(
  wrappedBase64: string,
  wrappingKey: Uint8Array
): Promise<string> {
  const kek = await crypto.subtle.importKey(
    'raw',
    wrappingKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const combined = base64ToBytes(wrappedBase64);
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertextWithTag = combined.slice(IV_LENGTH);
  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer, tagLength: GCM_TAG_LENGTH * 8 },
    kek,
    ciphertextWithTag
  );
  const plaintext = new TextDecoder().decode(plaintextBuffer);
  return fromBase64(plaintext);
}

/**
 * Convert Uint8Array to AESEncryptionKey (for PIN-derived key)
 * Note: AESEncryptionKey.import is async on web (WebCrypto) and native
 */
async function bytesToAESKey(bytes: Uint8Array): Promise<AESEncryptionKey> {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return AESEncryptionKey.import(hex, 'hex');
}

/**
 * Encrypt (wrap) data key with PIN-derived key using AES-256-GCM
 */
export async function wrapKey(
  dataKey: AESEncryptionKey,
  wrappingKey: Uint8Array
): Promise<string> {
  const keyHex = await dataKey.encoded('hex');
  if (isWeb) {
    return wrapKeyWeb(keyHex, wrappingKey);
  }
  const kek = await bytesToAESKey(wrappingKey);
  return encryptData(keyHex, kek);
}

/**
 * Derive key from password (alphanumeric) - same as PIN but for backup password.
 */
export async function deriveKeyFromPassword(
  password: string,
  saltHex: string
): Promise<Uint8Array> {
  return deriveKeyFromPin(password, saltHex);
}

/**
 * Encrypt plaintext with password-derived key. Used for backup v2.
 */
export async function encryptWithPassword(
  plaintext: string,
  password: string,
  saltHex: string
): Promise<string> {
  const keyBytes = await deriveKeyFromPassword(password, saltHex);
  const key = await bytesToAESKey(keyBytes);
  return encryptData(plaintext, key);
}

/**
 * Decrypt ciphertext with password-derived key. Used for backup v2.
 */
export async function decryptWithPassword(
  ciphertextBase64: string,
  password: string,
  saltHex: string
): Promise<string> {
  const keyBytes = await deriveKeyFromPassword(password, saltHex);
  const key = await bytesToAESKey(keyBytes);
  return decryptData(ciphertextBase64, key);
}

/**
 * Decrypt (unwrap) data key using PIN-derived key
 */
export async function unwrapKey(
  wrappedCiphertext: string,
  wrappingKey: Uint8Array
): Promise<AESEncryptionKey> {
  if (isWeb) {
    const keyHex = await unwrapKeyWeb(wrappedCiphertext, wrappingKey);
    return AESEncryptionKey.import(keyHex, 'hex');
  }
  const kek = await bytesToAESKey(wrappingKey);
  const keyHex = await decryptData(wrappedCiphertext, kek);
  return AESEncryptionKey.import(keyHex, 'hex');
}
