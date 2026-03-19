import * as LocalAuthentication from 'expo-local-authentication';
import { AESEncryptionKey } from 'expo-crypto';
import {
  deriveKeyFromPin,
  generateSalt,
  wrapKey,
  unwrapKey,
} from './encryption';
import * as storage from './storage';

let inMemoryDataKey: AESEncryptionKey | null = null;

export function isUnlocked(): boolean {
  return inMemoryDataKey !== null;
}

export function getDataKey(): AESEncryptionKey | null {
  return inMemoryDataKey;
}

export function lock(): void {
  inMemoryDataKey = null;
}

export async function isSetupComplete(): Promise<boolean> {
  return storage.isSetupComplete();
}

export async function hasBiometricHardware(): Promise<boolean> {
  return LocalAuthentication.hasHardwareAsync();
}

export async function isBiometricEnrolled(): Promise<boolean> {
  return LocalAuthentication.isEnrolledAsync();
}

export async function canUseBiometric(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

export async function setupPin(pin: string): Promise<void> {
  const salt = await generateSalt();
  await storage.setSalt(salt);

  const pinKey = await deriveKeyFromPin(pin, salt);
  const dataKey = await AESEncryptionKey.generate();

  const wrappedKey = await wrapKey(dataKey, pinKey);
  await storage.setDataKeyEncrypted(wrappedKey);

  const dataKeyHex = await dataKey.encoded('hex');
  try {
    await storage.setDataKeyBiometric(dataKeyHex);
  } catch {
    // Biometric storage optional - user can still use PIN
  }

  await storage.setSetupComplete();
  inMemoryDataKey = dataKey;
}

export async function unlockWithPin(pin: string): Promise<boolean> {
  const salt = await storage.getSalt();
  if (!salt) return false;

  const pinKey = await deriveKeyFromPin(pin, salt);
  const wrappedKey = await storage.getDataKeyEncrypted();
  if (!wrappedKey) return false;

  try {
    const dataKey = await unwrapKey(wrappedKey, pinKey);
    inMemoryDataKey = dataKey;
    return true;
  } catch {
    return false;
  }
}

export async function unlockWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Card Vault',
    fallbackLabel: 'Use PIN',
  });

  if (!result.success) return false;

  try {
    const dataKeyHex = await storage.getDataKeyBiometric();
    if (!dataKeyHex) return false;

    inMemoryDataKey = await AESEncryptionKey.import(dataKeyHex, 'hex');
    return true;
  } catch {
    return false;
  }
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  if (!inMemoryDataKey) return false;

  const salt = await storage.getSalt();
  if (!salt) return false;

  const currentPinKey = await deriveKeyFromPin(currentPin, salt);
  const wrappedKey = await storage.getDataKeyEncrypted();
  if (!wrappedKey) return false;

  try {
    const dataKey = await unwrapKey(wrappedKey, currentPinKey);
    const newSalt = await generateSalt();
    await storage.setSalt(newSalt);

    const newPinKey = await deriveKeyFromPin(newPin, newSalt);
    const newWrappedKey = await wrapKey(dataKey, newPinKey);
    await storage.setDataKeyEncrypted(newWrappedKey);

    const dataKeyHex = await dataKey.encoded('hex');
    try {
      await storage.setDataKeyBiometric(dataKeyHex);
    } catch {
      // Biometric storage optional
    }
    return true;
  } catch {
    return false;
  }
}
