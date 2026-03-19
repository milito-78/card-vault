import { Stack } from 'expo-router';

export default function CardIdLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#171717' },
        headerTintColor: '#fff',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Card Details' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Card' }} />
    </Stack>
  );
}
