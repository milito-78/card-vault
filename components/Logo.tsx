import React from 'react';
import { Image, View } from 'react-native';

const logoSource = require('@/assets/images/logo.png');

type LogoProps = {
  size?: number;
  /** Use 'dark' for light backgrounds (e.g. white header) */
  variant?: 'light' | 'dark';
};

export function Logo({ size = 64, variant = 'light' }: LogoProps) {
  // logo.png is 1376x768 (landscape), aspect ratio ~1.79:1
  const width = size * (1376 / 768);
  const height = size;
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={logoSource}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityLabel="Card Vault logo"
      />
    </View>
  );
}
