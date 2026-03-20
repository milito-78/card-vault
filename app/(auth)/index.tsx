import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { router } from 'expo-router';

export default function LockScreen() {
  const { t } = useLocale();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 360);

  const { authState, unlockWithPin, unlockWithBiometric, canUseBiometric } =
    useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const biometricTriedRef = useRef(false);
  const prevAuthRef = useRef(authState);

  useEffect(() => {
    if (authState === 'setup') {
      router.replace('/(auth)/setup');
      return;
    }
    if (authState === 'unlocked') {
      router.replace('/(tabs)');
      return;
    }
    if (prevAuthRef.current === 'unlocked' && authState === 'locked') {
      biometricTriedRef.current = false; // Reset when returning from background
    }
    prevAuthRef.current = authState;
    if (authState === 'locked' && canUseBiometric && !biometricTriedRef.current) {
      biometricTriedRef.current = true;
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
      setError(t('auth.pinMinDigits'));
      return;
    }

    setLoading(true);
    setError('');
    const success = await unlockWithPin(pin);
    setLoading(false);

    if (success) {
      router.replace('/(tabs)');
    } else {
      setError(t('auth.wrongPin'));
      setPin('');
    }
  }

  if (authState === 'loading' || authState === 'setup') {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-950">
        <Logo size={72} />
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-neutral-950"
    >
      <View className="flex-1 justify-center items-center px-6">
        <View style={{ width: contentWidth }} className="gap-6">
          <View className="items-center gap-3">
            <View accessible accessibilityLabel="Card Vault logo">
              <Logo size={72} />
            </View>
            <Text className="font-sans text-2xl font-bold text-white">{t('appName')}</Text>
            <Text className="font-sans text-neutral-400 text-center">
              {t('auth.enterPinToUnlock')}
            </Text>
          </View>

          <View className="gap-4">
            <TextInput
              className="font-sans rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-4 text-center text-xl text-white"
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
              <Text className="font-sans text-red-500 text-center text-sm">{error}</Text>
            ) : null}

            <Pressable
              onPress={handleUnlock}
              disabled={loading || pin.length < 6}
              className="rounded-xl bg-blue-600 py-4 active:bg-blue-500 disabled:opacity-50"
              style={{ minHeight: 48 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-sans text-center font-semibold text-white text-base">
                  {t('auth.unlock')}
                </Text>
              )}
            </Pressable>

            {canUseBiometric && (
              <Pressable
                onPress={tryBiometric}
                disabled={loading}
                className="py-3 active:opacity-70"
                style={{ minHeight: 44 }}
              >
                <Text className="font-sans text-blue-400 text-center text-sm">
                  {t('auth.useBiometric')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
