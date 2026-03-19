import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function SetupScreen() {
  const { setupPin } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'pin' | 'confirm'>('pin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSetPin() {
    if (pin.length < 6) {
      setError('PIN must be at least 6 digits');
      return;
    }
    setStep('confirm');
    setError('');
    setConfirmPin('');
  }

  async function handleConfirm() {
    if (confirmPin !== pin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await setupPin(pin);
      router.replace('/(tabs)');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Setup failed: ${message}`);
      console.error('Setup error:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-neutral-900"
    >
      <View className="flex-1 items-center justify-center px-8">
        <Text className="mb-2 text-2xl font-bold text-white">
          Create PIN
        </Text>
        <Text className="mb-8 text-center text-neutral-400">
          {step === 'pin'
            ? 'Enter a 6-digit PIN to secure your cards'
            : 'Confirm your PIN'}
        </Text>

        <TextInput
          className="mb-4 w-full rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-4 text-center text-xl text-white"
          placeholder="••••••"
          placeholderTextColor="#737373"
          value={step === 'pin' ? pin : confirmPin}
          onChangeText={(t) => {
            const cleaned = t.replace(/\D/g, '').slice(0, 8);
            if (step === 'pin') {
              setPin(cleaned);
            } else {
              setConfirmPin(cleaned);
            }
            setError('');
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          editable={!loading}
        />

        {error ? (
          <Text className="mb-4 max-w-full text-center text-sm text-red-500">
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={step === 'pin' ? handleSetPin : handleConfirm}
          disabled={
            loading ||
            (step === 'pin' ? pin.length < 6 : confirmPin.length < 6)
          }
          className="mb-4 w-full rounded-xl bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">
              {step === 'pin' ? 'Continue' : 'Create PIN'}
            </Text>
          )}
        </Pressable>

        {step === 'confirm' && (
          <Pressable
            onPress={() => {
              setStep('pin');
              setConfirmPin('');
              setError('');
            }}
            className="py-2"
          >
            <Text className="text-neutral-400">Back</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
