import '../global.css';
import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { CardsRefreshProvider } from '@/contexts/CardsRefreshContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { Platform, StatusBar, View, Text, Pressable } from 'react-native';

// Sentry DSN from env - create one at https://sentry.io
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  tracesSampleRate: 0.2,
  enableAutoSessionTracking: true,
  attachStacktrace: true,
  debug: false,
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS === 'ios' && loaded) {
      import('@/widgets/CardVaultWidget').then(({ default: Widget }) => {
        Widget.updateSnapshot({ message: 'Tap to unlock' });
      }).catch(() => {});
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => {
        Sentry.captureException(error);
        return (
          <SafeAreaProvider>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a', padding: 24 }}>
              <Text style={{ color: '#fff', fontSize: 18, marginBottom: 16, textAlign: 'center', fontFamily: 'Vazirmatn_400Regular' }}>
                Something went wrong. The error has been reported.
              </Text>
              <Pressable onPress={resetError} style={{ backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontFamily: 'Vazirmatn_400Regular' }}>Try again</Text>
              </Pressable>
            </View>
          </SafeAreaProvider>
        );
      }}
    >
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <LocaleProvider>
          <AuthProvider>
            <CardsRefreshProvider>
              <RootLayoutNav />
            </CardsRefreshProvider>
          </AuthProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </Sentry.ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="card" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
