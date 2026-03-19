import React from 'react';
import { View, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { Logo } from '@/components/Logo';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#737373',
        tabBarStyle: { backgroundColor: '#171717', borderTopColor: '#262626' },
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: '#171717' },
        headerTintColor: '#ffffff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Cards',
          headerTitle: () => (
            <View className="flex-row items-center gap-2">
              <Logo size={28} variant="light" />
              <Text className="text-lg font-bold text-white">Cards</Text>
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'creditcard',
                android: 'credit_card',
                web: 'credit_card',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: () => (
            <View className="flex-row items-center gap-2">
              <Logo size={28} variant="light" />
              <Text className="text-lg font-bold text-white">Settings</Text>
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'gearshape',
                android: 'settings',
                web: 'settings',
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
