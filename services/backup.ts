import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  deriveKeyFromPin,
  unwrapKey,
  encryptWithPassword,
  decryptWithPassword,
  generateSalt,
} from './encryption';
import * as storage from './storage';

const BACKUP_VERSION_V1 = 1;
const BACKUP_VERSION_V2 = 2;

export interface BackupDataV1 {
  version: 1;
  createdAt: number;
  salt: string;
  dataKeyEncrypted: string;
  cardsEncrypted: string;
}

export interface BackupDataV2 {
  version: 2;
  createdAt: number;
  backupSalt: string;
  encryptedPayload: string;
}

export type BackupData = BackupDataV1 | BackupDataV2;

const MIN_BACKUP_PASSWORD_LENGTH = 8;

/**
 * Export backup as JSON string. Validates PIN before exporting.
 */
export async function exportBackup(pin: string): Promise<string> {
  const salt = await storage.getSalt();
  const dataKeyEncrypted = await storage.getDataKeyEncrypted();
  const cardsEncrypted = await storage.getCardsEncrypted();

  if (!salt || !dataKeyEncrypted || !cardsEncrypted) {
    throw new Error('No data to export');
  }

  const pinKey = await deriveKeyFromPin(pin, salt);
  try {
    await unwrapKey(dataKeyEncrypted, pinKey);
  } catch {
    throw new Error('Invalid PIN');
  }

  const backup: BackupDataV1 = {
    version: BACKUP_VERSION_V1,
    createdAt: Date.now(),
    salt,
    dataKeyEncrypted,
    cardsEncrypted,
  };

  return JSON.stringify(backup);
}

/**
 * Validate backup password: 8+ chars, letters and/or numbers.
 */
export function isBackupPasswordValid(password: string): boolean {
  return password.length >= MIN_BACKUP_PASSWORD_LENGTH;
}

/**
 * Export backup with backup password (v2 format). More secure than PIN.
 * Password must be 8+ characters (alphanumeric).
 */
export async function exportBackupWithPassword(
  backupPassword: string
): Promise<string> {
  const salt = await storage.getSalt();
  const dataKeyEncrypted = await storage.getDataKeyEncrypted();
  const cardsEncrypted = await storage.getCardsEncrypted();

  if (!salt || !dataKeyEncrypted || !cardsEncrypted) {
    throw new Error('No data to export');
  }

  const innerBackup: BackupDataV1 = {
    version: BACKUP_VERSION_V1,
    createdAt: Date.now(),
    salt,
    dataKeyEncrypted,
    cardsEncrypted,
  };

  const backupSalt = await generateSalt();
  const innerJson = JSON.stringify(innerBackup);
  const encryptedPayload = await encryptWithPassword(
    innerJson,
    backupPassword,
    backupSalt
  );

  const backup: BackupDataV2 = {
    version: BACKUP_VERSION_V2,
    createdAt: Date.now(),
    backupSalt,
    encryptedPayload,
  };

  return JSON.stringify(backup);
}

/**
 * Parse backup file to detect version (v1 = PIN, v2 = backup password).
 */
export function getBackupVersion(json: string): 1 | 2 | null {
  try {
    const parsed = JSON.parse(json) as { version?: number };
    if (parsed.version === 1) return 1;
    if (parsed.version === 2) return 2;
    return null;
  } catch {
    return null;
  }
}

/**
 * Import backup from JSON string. Use PIN for v1, backup password for v2.
 */
export async function importBackup(
  json: string,
  pinOrPassword: string
): Promise<void> {
  let backup: BackupData;
  try {
    backup = JSON.parse(json) as BackupData;
  } catch {
    throw new Error('Invalid backup file');
  }

  let innerBackup: BackupDataV1;

  if (backup.version === BACKUP_VERSION_V2) {
    const v2 = backup as BackupDataV2;
    if (!v2.backupSalt || !v2.encryptedPayload) {
      throw new Error('Invalid backup format');
    }
    try {
      const decrypted = await decryptWithPassword(
        v2.encryptedPayload,
        pinOrPassword,
        v2.backupSalt
      );
      innerBackup = JSON.parse(decrypted) as BackupDataV1;
    } catch {
      throw new Error('Invalid backup password');
    }
  } else if (backup.version === BACKUP_VERSION_V1) {
    const v1 = backup as BackupDataV1;
    if (!v1.salt || !v1.dataKeyEncrypted || !v1.cardsEncrypted) {
      throw new Error('Invalid backup format');
    }
    const pinKey = await deriveKeyFromPin(pinOrPassword, v1.salt);
    try {
      await unwrapKey(v1.dataKeyEncrypted, pinKey);
    } catch {
      throw new Error('Invalid PIN');
    }
    innerBackup = v1;
  } else {
    throw new Error('Invalid backup format');
  }

  await storage.setSalt(innerBackup.salt);
  await storage.setDataKeyEncrypted(innerBackup.dataKeyEncrypted);
  await storage.setCardsEncrypted(innerBackup.cardsEncrypted);
  await storage.setSetupComplete();
}

/**
 * Share backup file (iOS/Android). Writes to temp file and shares.
 */
export async function shareBackup(backupJson: string): Promise<void> {
  const filename = `card-vault-backup-${Date.now()}.json`;
  const path = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(path, backupJson, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: 'Export Card Vault Backup',
  });
}

/**
 * Pick backup file for import (iOS/Android).
 */
export async function pickBackupFile(): Promise<string> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    throw new Error('File picker canceled');
  }

  const file = result.assets[0];
  const content = await FileSystem.readAsStringAsync(file.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return content;
}

/**
 * Export and share on mobile; return JSON string on web for download.
 * Use pin for v1 format, backupPassword for v2 format.
 */
export async function exportAndShareBackup(
  pinOrPassword: string,
  useBackupPassword: boolean
): Promise<string> {
  const backupJson = useBackupPassword
    ? await exportBackupWithPassword(pinOrPassword)
    : await exportBackup(pinOrPassword);

  if (Platform.OS === 'web') {
    return backupJson;
  }

  await shareBackup(backupJson);
  return backupJson;
}
