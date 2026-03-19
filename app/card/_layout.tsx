import { Stack } from 'expo-router';

export default function CardLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#171717' },
        headerTintColor: '#fff',
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="add" options={{ title: 'Add Card' }} />
      <Stack.Screen name="[id]" options={{ title: 'Card Details' }} />
    </Stack>
  );
}
