import { View, Text, Pressable } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { lock } = useAuth();

  function handleLock() {
    lock();
    router.replace('/(auth)');
  }

  return (
    <View className="flex-1 bg-neutral-900 p-4">
      <Text className="mb-6 text-xl font-bold text-white">Settings</Text>

      <Pressable
        onPress={handleLock}
        className="rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:bg-neutral-700"
      >
        <Text className="font-medium text-white">Lock App</Text>
        <Text className="mt-1 text-sm text-neutral-400">
          Lock the app and require PIN or biometric to unlock
        </Text>
      </Pressable>

      <View className="mt-8">
        <Text className="text-sm text-neutral-500">Card Vault v1.0</Text>
      </View>
    </View>
  );
}
