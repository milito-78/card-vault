import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function LockScreen() {
  const { authState, unlockWithPin, unlockWithBiometric, canUseBiometric } =
    useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authState === 'setup') {
      router.replace('/(auth)/setup');
      return;
    }
    if (authState === 'unlocked') {
      router.replace('/(tabs)');
      return;
    }
    if (authState === 'locked' && canUseBiometric && !loading) {
      tryBiometric();
    }
  }, [authState, canUseBiometric]);

  async function tryBiometric() {
    setLoading(true);
    const success = await unlockWithBiometric();
    setLoading(false);
    if (success) {
      router.replace('/(tabs)');
    }
  }

  async function handleUnlock() {
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    const success = await unlockWithPin(pin);
    setLoading(false);

    if (success) {
      router.replace('/(tabs)');
    } else {
      setError('Wrong PIN');
      setPin('');
    }
  }

  if (authState === 'loading' || authState === 'setup') {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-900">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-neutral-900"
    >
      <View className="flex-1 items-center justify-center px-8">
        <Text className="mb-2 text-2xl font-bold text-white">Card Vault</Text>
        <Text className="mb-8 text-neutral-400">
          Enter your PIN to unlock
        </Text>

        <TextInput
          className="mb-4 w-full rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-4 text-center text-xl text-white"
          placeholder="••••••"
          placeholderTextColor="#737373"
          value={pin}
          onChangeText={(t) => {
            setPin(t.replace(/\D/g, '').slice(0, 8));
            setError('');
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          editable={!loading}
        />

        {error ? (
          <Text className="mb-4 text-red-500">{error}</Text>
        ) : null}

        <Pressable
          onPress={handleUnlock}
          disabled={loading || pin.length < 6}
          className="mb-4 w-full rounded-xl bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">
              Unlock
            </Text>
          )}
        </Pressable>

        {canUseBiometric && (
          <Pressable
            onPress={tryBiometric}
            disabled={loading}
            className="py-2 active:opacity-70"
          >
            <Text className="text-blue-500">Use Face ID / Fingerprint</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
