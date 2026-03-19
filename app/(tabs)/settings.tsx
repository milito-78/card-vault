import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import * as storage from '@/services/storage';
import { AUTO_LOCK_OPTIONS } from '@/services/storage';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { lock, changePin } = useAuth();
  const [autoLockTimeout, setAutoLockTimeout] = useState(60);
  const [loadingTimeout, setLoadingTimeout] = useState(true);
  const [changePinMode, setChangePinMode] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const timeout = await storage.getAutoLockTimeout();
    setAutoLockTimeout(timeout);
    setLoadingTimeout(false);
  }

  async function handleSetAutoLock(value: number) {
    await storage.setAutoLockTimeout(value);
    setAutoLockTimeout(value);
  }

  function handleLock() {
    lock();
    router.replace('/(auth)');
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
    <ScrollView className="flex-1 bg-neutral-900 p-4">
      <Text className="mb-6 text-xl font-bold text-white">Settings</Text>

      <Text className="mb-2 text-sm font-medium text-neutral-400">
        Auto-Lock Timeout
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

      {!changePinMode ? (
        <Pressable
          onPress={() => setChangePinMode(true)}
          className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:bg-neutral-700"
        >
          <Text className="font-medium text-white">Change PIN</Text>
          <Text className="mt-1 text-sm text-neutral-400">
            Update your unlock PIN
          </Text>
        </Pressable>
      ) : (
        <View className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4">
          <Text className="mb-3 font-medium text-white">Change PIN</Text>
          <TextInput
            className="mb-2 rounded-lg border border-neutral-600 bg-neutral-900 px-4 py-3 text-white"
            placeholder="Current PIN"
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
            placeholder="New PIN (6 digits)"
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
            placeholder="Confirm new PIN"
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
            <Text className="mb-2 text-sm text-red-500">{pinError}</Text>
          ) : null}
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleChangePin}
              className="flex-1 rounded-lg bg-blue-600 py-2 active:bg-blue-700"
            >
              <Text className="text-center font-medium text-white">
                Change PIN
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
              <Text className="text-center font-medium text-neutral-300">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        onPress={handleLock}
        className="mb-6 rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:bg-neutral-700"
      >
        <Text className="font-medium text-white">Lock App</Text>
        <Text className="mt-1 text-sm text-neutral-400">
          Lock the app and require PIN or biometric to unlock
        </Text>
      </Pressable>

      <View className="mt-4">
        <Text className="text-sm text-neutral-500">
          Card Vault v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>
    </ScrollView>
  );
}
