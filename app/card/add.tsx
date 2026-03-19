import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { addCard } from '@/services/cards';

export default function AddCardScreen() {
  const router = useRouter();
  const [bankName, setBankName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv2, setCvv2] = useState('');
  const [expDate, setExpDate] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function formatCardNumber(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 19);
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ').trim();
  }

  function formatExpDate(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  }

  async function handleSave() {
    setError('');
    if (!bankName.trim()) {
      setError('Bank name is required');
      return;
    }
    const cleanedNumber = cardNumber.replace(/\D/g, '');
    if (cleanedNumber.length < 13) {
      setError('Card number is invalid');
      return;
    }
    if (!cvv2.trim()) {
      setError('CVV is required');
      return;
    }
    if (expDate.replace(/\D/g, '').length !== 4) {
      setError('Expiry date must be MM/YY');
      return;
    }

    setLoading(true);
    try {
      await addCard({
        bankName: bankName.trim(),
        cardNumber: cleanedNumber,
        cvv2: cvv2.trim(),
        expDate: formatExpDate(expDate),
        password: password.trim(),
        notes: notes.trim(),
      });
      router.back();
    } catch (e) {
      setError('Failed to save card');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-neutral-900"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="mb-2 text-sm font-medium text-neutral-400">
          Bank Name
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-white"
          placeholder="e.g. Bank Melli"
          placeholderTextColor="#737373"
          value={bankName}
          onChangeText={setBankName}
          autoCapitalize="words"
        />

        <Text className="mb-2 text-sm font-medium text-neutral-400">
          Card Number
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 font-mono text-white"
          placeholder="1234 5678 9012 3456"
          placeholderTextColor="#737373"
          value={cardNumber}
          onChangeText={(t) => setCardNumber(formatCardNumber(t))}
          keyboardType="number-pad"
          maxLength={19}
        />

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-neutral-400">
              CVV2
            </Text>
            <TextInput
              className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 font-mono text-white"
              placeholder="123"
              placeholderTextColor="#737373"
              value={cvv2}
              onChangeText={(t) => setCvv2(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-neutral-400">
              Expiry (MM/YY)
            </Text>
            <TextInput
              className="rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 font-mono text-white"
              placeholder="12/28"
              placeholderTextColor="#737373"
              value={expDate}
              onChangeText={(t) => setExpDate(formatExpDate(t))}
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
        </View>

        <Text className="mb-2 mt-4 text-sm font-medium text-neutral-400">
          ATM / Offline Password (optional)
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-white"
          placeholder="e.g. ATM PIN"
          placeholderTextColor="#737373"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text className="mb-2 text-sm font-medium text-neutral-400">
          Notes (optional)
        </Text>
        <TextInput
          className="mb-4 rounded-xl border border-neutral-600 bg-neutral-800 px-4 py-3 text-white"
          placeholder="e.g. account number, extra info"
          placeholderTextColor="#737373"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {error ? (
          <Text className="mb-4 text-red-500">{error}</Text>
        ) : null}

        <Pressable
          onPress={handleSave}
          disabled={loading}
          className="rounded-xl bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
        >
          <Text className="text-center font-semibold text-white">
            {loading ? 'Saving...' : 'Save Card'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
