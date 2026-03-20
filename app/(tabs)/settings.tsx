import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/contexts/AuthContext';
import * as auth from '@/services/auth';
import { useLocale } from '@/contexts/LocaleContext';
import { router } from 'expo-router';
import * as storage from '@/services/storage';
import * as backup from '@/services/backup';
import {
  AUTO_LOCK_OPTIONS,
  type SortBy,
  type SortOrder,
} from '@/services/storage';
import Constants from 'expo-constants';
import { getDebugLogContent } from '@/services/debugLog';

export default function SettingsScreen() {
  const { t, locale, setLocale } = useLocale();
  const { lock, changePin, refreshBiometricPreference } = useAuth();
  const [autoLockTimeout, setAutoLockTimeout] = useState(60);
  const [biometricEnabled, setBiometricEnabledState] = useState(true);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [changePinMode, setChangePinMode] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [exportMode, setExportMode] = useState(false);
  const [exportUseBackupPassword, setExportUseBackupPassword] = useState(false);
  const [exportPin, setExportPin] = useState('');
  const [exportPassword, setExportPassword] = useState('');
  const [exportConfirmPassword, setExportConfirmPassword] = useState('');
  const [importMode, setImportMode] = useState(false);
  const [importPin, setImportPin] = useState('');
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importVersion, setImportVersion] = useState<1 | 2 | null>(null);
  const [backupError, setBackupError] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const [timeout, sortPref, bioEnabled, hasBio] = await Promise.all([
      storage.getAutoLockTimeout(),
      storage.getSortPreference(),
      storage.getBiometricEnabled(),
      auth.canUseBiometric(),
    ]);
    setAutoLockTimeout(timeout);
    setSortBy(sortPref.sortBy);
    setSortOrder(sortPref.sortOrder);
    setBiometricEnabledState(bioEnabled);
    setHasBiometricHardware(hasBio);
    setLoadingTimeout(false);
  }

  async function handleBiometricToggle(value: boolean) {
    if (value) {
      const stored = await auth.enableBiometricStorage();
      if (!stored) {
        Alert.alert(t('settings.biometricEnableFailed'), t('settings.biometricEnableFailedDesc'));
        return;
      }
    } else {
      await storage.clearDataKeyBiometric();
    }
    await storage.setBiometricEnabled(value);
    setBiometricEnabledState(value);
    await refreshBiometricPreference();
  }

  async function handleSetAutoLock(value: number) {
    await storage.setAutoLockTimeout(value);
    setAutoLockTimeout(value);
  }

  async function handleSetSort(sortBy: SortBy, sortOrder: SortOrder) {
    await storage.setSortPreference(sortBy, sortOrder);
    setSortBy(sortBy);
    setSortOrder(sortOrder);
  }

  function handleLock() {
    lock();
    router.replace('/(auth)');
  }

  async function handleExportBackup() {
    setBackupError('');
    if (exportUseBackupPassword) {
      if (!backup.isBackupPasswordValid(exportPassword)) {
        setBackupError('Password must be 8+ characters');
        return;
      }
      if (exportPassword !== exportConfirmPassword) {
        setBackupError('Passwords do not match');
        return;
      }
    } else if (exportPin.length < 6) {
      setBackupError(t('settings.pinDigits'));
      return;
    }
    setBackupLoading(true);
    try {
      const credential = exportUseBackupPassword ? exportPassword : exportPin;
      let json: string;
      if (exportUseBackupPassword) {
        json = await backup.exportBackupWithPassword(credential);
      } else {
        json = await backup.exportBackup(credential);
      }
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `card-vault-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Backup downloaded');
      } else {
        await backup.shareBackup(json);
        Alert.alert('Success', 'Backup exported');
      }
      setExportMode(false);
      setExportPin('');
      setExportPassword('');
      setExportConfirmPassword('');
    } catch (e) {
      setBackupError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handlePickImportFile() {
    setBackupError('');
    try {
      const json = await backup.pickBackupFile();
      const version = backup.getBackupVersion(json);
      if (!version) {
        setBackupError('Invalid backup file');
        return;
      }
      setImportFileContent(json);
      setImportVersion(version);
    } catch (e) {
      if ((e as Error).message !== 'File picker canceled') {
        setBackupError(e instanceof Error ? e.message : 'Failed to pick file');
      }
    }
  }

  async function handleImportBackup() {
    setBackupError('');
    if (importVersion === 2) {
      if (!backup.isBackupPasswordValid(importPin)) {
        setBackupError('Password must be 8+ characters');
        return;
      }
    } else if (importPin.length < 6) {
      setBackupError(t('settings.pinDigits'));
      return;
    }
    if (!importFileContent) {
      setBackupError('Pick a file first');
      return;
    }
    setBackupLoading(true);
    try {
      await backup.importBackup(importFileContent, importPin);
      lock();
      setImportMode(false);
      setImportPin('');
      setImportFileContent(null);
      setImportVersion(null);
      Alert.alert('Success', 'Backup restored. Please unlock with your PIN.', [
        { text: 'OK', onPress: () => router.replace('/(auth)') },
      ]);
    } catch (e) {
      setBackupError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBackupLoading(false);
    }
  }

  function startImport() {
    setBackupError('');
    setImportMode(true);
    setImportPin('');
    setImportFileContent(null);
    setImportVersion(null);
  }

  async function handleChangePin() {
    setPinError('');
    if (currentPin.length < 6) {
      setPinError('Current PIN must be at least 6 digits');
      return;
    }
    if (newPin.length < 6) {
      setPinError('New PIN must be at least 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PINs do not match');
      return;
    }
    if (currentPin === newPin) {
      setPinError('New PIN must be different from current PIN');
      return;
    }

    const success = await changePin(currentPin, newPin);
    if (success) {
      setChangePinMode(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      Alert.alert('Success', 'PIN changed successfully');
    } else {
      setPinError('Current PIN is incorrect');
    }
  }

  if (loadingTimeout) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView
        className="flex-1 bg-neutral-900 p-4"
        keyboardShouldPersistTaps="handled"
      >
      <Text className="font-sans mb-6 text-xl font-bold text-white">{t('settings.title')}</Text>

      <Text className="font-sans mb-2 text-sm font-medium text-neutral-400">
        {t('settings.language')}
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {(['en', 'ar', 'fa'] as const).map((loc) => (
          <Pressable
            key={loc}
            onPress={() => setLocale(loc)}
            className={`rounded-xl border px-4 py-2 ${
              locale === loc
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-neutral-700 bg-neutral-800'
            }`}
          >
            <Text
              className={
                locale === loc
                  ? 'font-medium text-blue-400'
                  : 'text-neutral-300'
              }
            >
              {loc === 'en'
                ? t('settings.english')
                : loc === 'ar'
                  ? t('settings.arabic')
                  : t('settings.persian')}
            </Text>
          </Pressable>
        ))}
      </View>

      {hasBiometricHardware ? (
        <View className="mb-6 flex-row items-center justify-between rounded-xl border border-neutral-700 bg-neutral-800 p-4">
          <View className="flex-1">
            <Text className="font-sans font-medium text-white">{t('settings.biometricUnlock')}</Text>
            <Text className="font-sans mt-1 text-sm text-neutral-400">
              {t('settings.biometricUnlockDesc')}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: '#525252', true: '#3b82f6' }}
            thumbColor="#fff"
          />
        </View>
      ) : null}

      <Text className="font-sans mb-2 text-sm font-medium text-neutral-400">
        {t('settings.autoLockTimeout')}
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {AUTO_LOCK_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => handleSetAutoLock(opt.value)}
            className={`rounded-xl border px-4 py-2 ${
              autoLockTimeout === opt.value
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-neutral-700 bg-neutral-800'
            }`}
          >
            <Text
              className={
                autoLockTimeout === opt.value
                  ? 'font-medium text-blue-400'
                  : 'text-neutral-300'
              }
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="font-sans mb-2 text-sm font-medium text-neutral-400">
        {t('settings.sortBy')}
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {(['bankName', 'createdAt'] as const).map((by) => (
          <Pressable
            key={by}
            onPress={() =>
              handleSetSort(
                by,
                by === sortBy ? sortOrder : by === 'bankName' ? 'asc' : 'desc'
              )
            }
            className={`rounded-xl border px-4 py-2 ${
              sortBy === by
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-neutral-700 bg-neutral-800'
            }`}
          >
            <Text
              className={
                sortBy === by
                  ? 'font-medium text-blue-400'
                  : 'text-neutral-300'
              }
            >
              {by === 'bankName' ? t('settings.bankName') : t('settings.dateAdded')}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="font-sans mb-2 text-sm font-medium text-neutral-400">
        {t('settings.sortOrder')}
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {(['asc', 'desc'] as const).map((order) => (
          <Pressable
            key={order}
            onPress={() => handleSetSort(sortBy, order)}
            className={`rounded-xl border px-4 py-2 ${
              sortOrder === order
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-neutral-700 bg-neutral-800'
            }`}
          >
            <Text
              className={
                sortOrder === order
                  ? 'font-medium text-blue-400'
                  : 'text-neutral-300'
              }
            >
              {sortBy === 'bankName'
                ? order === 'asc'
                  ? t('settings.az')
                  : t('settings.za')
                : order === 'asc'
                  ? t('settings.oldestFirst')
                  : t('settings.newestFirst')}
            </Text>
          </Pressable>
        ))}
      </View>

      {!changePinMode ? (
        <Pressable
          onPress={() => setChangePinMode(true)}
          className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:bg-neutral-700"
        >
          <Text className="font-sans font-medium text-white">{t('settings.changePin')}</Text>
          <Text className="font-sans mt-1 text-sm text-neutral-400">
            {t('settings.changePinDesc')}
          </Text>
        </Pressable>
      ) : (
        <View className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4">
          <Text className="font-sans mb-3 font-medium text-white">{t('settings.changePin')}</Text>
          <TextInput
            className="mb-2 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-white"
            placeholder={t('settings.currentPin')}
            placeholderTextColor="#737373"
            value={currentPin}
            onChangeText={(t) => {
              setCurrentPin(t.replace(/\D/g, '').slice(0, 6));
              setPinError('');
            }}
            keyboardType="number-pad"
            secureTextEntry
          />
          <TextInput
            className="mb-2 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-white"
            placeholder={t('settings.newPin')}
            placeholderTextColor="#737373"
            value={newPin}
            onChangeText={(t) => {
              setNewPin(t.replace(/\D/g, '').slice(0, 6));
              setPinError('');
            }}
            keyboardType="number-pad"
            secureTextEntry
          />
          <TextInput
            className="mb-2 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-white"
            placeholder={t('settings.confirmNewPin')}
            placeholderTextColor="#737373"
            value={confirmPin}
            onChangeText={(t) => {
              setConfirmPin(t.replace(/\D/g, '').slice(0, 6));
              setPinError('');
            }}
            keyboardType="number-pad"
            secureTextEntry
          />
          {pinError ? (
            <Text className="font-sans mb-2 text-sm text-red-500">{pinError}</Text>
          ) : null}
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleChangePin}
              className="flex-1 rounded-lg bg-blue-600 py-2 active:bg-blue-700"
            >
              <Text className="font-sans text-center font-medium text-white">
                {t('settings.changePin')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setChangePinMode(false);
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
                setPinError('');
              }}
              className="flex-1 rounded-lg border border-neutral-600 py-2 active:bg-neutral-700"
            >
              <Text className="font-sans text-center font-medium text-neutral-300">
                {t('settings.cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {!exportMode ? (
        <Pressable
          onPress={() => setExportMode(true)}
          className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:bg-neutral-700"
        >
          <Text className="font-sans font-medium text-white">{t('settings.exportBackup')}</Text>
          <Text className="font-sans mt-1 text-sm text-neutral-400">
            {t('settings.exportBackupDesc')}
          </Text>
        </Pressable>
      ) : (
        <View className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4">
          <Text className="font-sans mb-3 font-medium text-white">{t('settings.exportBackup')}</Text>
          <View className="mb-3 flex-row gap-2">
            <Pressable
              onPress={() => {
                setExportUseBackupPassword(false);
                setBackupError('');
              }}
              className={`flex-1 rounded-lg border px-3 py-2 ${
                !exportUseBackupPassword
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-neutral-600 bg-neutral-900'
              }`}
            >
              <Text
                className={
                  !exportUseBackupPassword
                    ? 'text-center text-sm font-medium text-blue-400'
                    : 'text-center text-sm text-neutral-400'
                }
              >
                {t('settings.usePin')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setExportUseBackupPassword(true);
                setBackupError('');
              }}
              className={`flex-1 rounded-lg border px-3 py-2 ${
                exportUseBackupPassword
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-neutral-600 bg-neutral-900'
              }`}
            >
              <Text
                className={
                  exportUseBackupPassword
                    ? 'text-center text-sm font-medium text-blue-400'
                    : 'text-center text-sm text-neutral-400'
                }
              >
                {t('settings.useBackupPassword')}
              </Text>
            </Pressable>
          </View>
          <Text className="font-sans mb-2 text-sm text-neutral-400">
            {exportUseBackupPassword
              ? t('settings.enterBackupPasswordToExport')
              : t('settings.enterPinToExport')}
          </Text>
          {exportUseBackupPassword ? (
            <>
              <TextInput
                className="mb-2 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-white"
                placeholder={t('settings.backupPassword')}
                placeholderTextColor="#737373"
                value={exportPassword}
                onChangeText={(text) => {
                  setExportPassword(text);
                  setBackupError('');
                }}
                secureTextEntry
                editable={!backupLoading}
              />
              <TextInput
                className="mb-2 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-white"
                placeholder={t('settings.confirmBackupPassword')}
                placeholderTextColor="#737373"
                value={exportConfirmPassword}
                onChangeText={(text) => {
                  setExportConfirmPassword(text);
                  setBackupError('');
                }}
                secureTextEntry
                editable={!backupLoading}
              />
            </>
          ) : (
            <TextInput
              className="mb-2 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-white"
              placeholder={t('settings.pinDigits')}
              placeholderTextColor="#737373"
              value={exportPin}
              onChangeText={(text) => {
                setExportPin(text.replace(/\D/g, '').slice(0, 8));
                setBackupError('');
              }}
              keyboardType="number-pad"
              secureTextEntry
              editable={!backupLoading}
            />
          )}
          {backupError ? (
            <Text className="font-sans mb-2 text-sm text-red-500">{backupError}</Text>
          ) : null}
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleExportBackup}
              disabled={
                backupLoading ||
                (exportUseBackupPassword
                  ? !backup.isBackupPasswordValid(exportPassword) ||
                    exportPassword !== exportConfirmPassword
                  : exportPin.length < 6)
              }
              className="flex-1 rounded-lg bg-blue-600 py-2 active:bg-blue-700 disabled:opacity-50"
            >
              <Text className="font-sans text-center font-medium text-white">
                {backupLoading ? t('settings.exporting') : t('settings.exportButton')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setExportMode(false);
                setExportPin('');
                setExportPassword('');
                setExportConfirmPassword('');
                setBackupError('');
              }}
              disabled={backupLoading}
              className="flex-1 rounded-lg border border-neutral-600 py-2 active:bg-neutral-700"
            >
              <Text className="font-sans text-center font-medium text-neutral-300">
                {t('settings.cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {!importMode ? (
        <Pressable
          onPress={startImport}
          className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:bg-neutral-700"
        >
          <Text className="font-sans font-medium text-white">Import Backup</Text>
          <Text className="font-sans mt-1 text-sm text-neutral-400">
            Restore from encrypted backup file
          </Text>
        </Pressable>
      ) : (
        <View className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4">
          <Text className="font-sans mb-3 font-medium text-white">{t('settings.importBackup')}</Text>
          {!importFileContent ? (
            <>
              <Text className="font-sans mb-2 text-sm text-neutral-400">
                {t('settings.pickFileFirst')}
              </Text>
              <Pressable
                onPress={handlePickImportFile}
                disabled={backupLoading}
                className="mb-2 rounded-lg bg-blue-600 py-2 active:bg-blue-700 disabled:opacity-50"
              >
                <Text className="font-sans text-center font-medium text-white">
                  Pick Backup File
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="font-sans mb-2 text-sm text-neutral-400">
                {importVersion === 2
                  ? t('settings.enterBackupPasswordToImport')
                  : t('settings.enterPinToImport')}
              </Text>
              <TextInput
                className="mb-2 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-white"
                placeholder={
                  importVersion === 2
                    ? t('settings.backupPassword')
                    : t('settings.pinDigits')
                }
                placeholderTextColor="#737373"
                value={importPin}
                onChangeText={(text) => {
                  setImportPin(
                    importVersion === 2 ? text : text.replace(/\D/g, '').slice(0, 8)
                  );
                  setBackupError('');
                }}
                keyboardType={importVersion === 2 ? 'default' : 'number-pad'}
                secureTextEntry
                editable={!backupLoading}
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleImportBackup}
                  disabled={
                    backupLoading ||
                    (importVersion === 2
                      ? !backup.isBackupPasswordValid(importPin)
                      : importPin.length < 6)
                  }
                  className="flex-1 rounded-lg bg-blue-600 py-2 active:bg-blue-700 disabled:opacity-50"
                >
                  <Text className="font-sans text-center font-medium text-white">
                    {backupLoading ? t('settings.importing') : 'Import'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setImportFileContent(null);
                    setImportVersion(null);
                    setImportPin('');
                    setBackupError('');
                  }}
                  disabled={backupLoading}
                  className="rounded-lg border border-neutral-600 px-3 py-2 active:bg-neutral-700"
                >
                  <Text className="font-sans text-center font-medium text-neutral-300">
                    Change File
                  </Text>
                </Pressable>
              </View>
            </>
          )}
          {backupError ? (
            <Text className="font-sans mb-2 mt-2 text-sm text-red-500">{backupError}</Text>
          ) : null}
          <Pressable
            onPress={() => {
              setImportMode(false);
              setImportPin('');
              setImportFileContent(null);
              setImportVersion(null);
              setBackupError('');
            }}
            disabled={backupLoading}
            className="mt-2 rounded-lg border border-neutral-600 py-2 active:bg-neutral-700"
          >
            <Text className="font-sans text-center font-medium text-neutral-300">
              {t('settings.cancel')}
            </Text>
          </Pressable>
        </View>
      )}

      <Pressable
        onPress={handleLock}
        className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:bg-neutral-700"
      >
        <Text className="font-sans font-medium text-white">{t('settings.lockApp')}</Text>
        <Text className="font-sans mt-1 text-sm text-neutral-400">
          {t('settings.lockAppDesc')}
        </Text>
      </Pressable>

      <View className="mt-4">
        <Text className="font-sans text-sm text-neutral-500">
          Card Vault v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
        {__DEV__ ? (
          <Pressable
            onPress={async () => {
              const log = getDebugLogContent();
              if (log) {
                await Clipboard.setStringAsync(log);
                Alert.alert('Debug log copied', 'Paste somewhere to share.');
              } else {
                Alert.alert('Debug log empty', 'Add a card first, then try again.');
              }
            }}
            className="mt-2 rounded-lg border border-neutral-600 py-2 active:bg-neutral-700"
          >
            <Text className="font-sans text-center text-sm text-neutral-400">Copy debug log</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
