import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type LogoProps = {
  size?: number;
  color?: string;
  /** Use 'dark' for light backgrounds (e.g. white header) */
  variant?: 'light' | 'dark';
};

export function Logo({
  size = 64,
  color = '#3b82f6',
  variant = 'light',
}: LogoProps) {
  const stroke = variant === 'dark' ? '#171717' : 'white';
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Shield outline */}
      <Path
        d="M32 8 L52 16 L52 32 Q52 44 32 52 Q12 44 12 32 L12 16 Z"
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* Padlock body */}
      <Rect
        x={26}
        y={28}
        width={12}
        height={10}
        rx={2}
        fill={color}
        stroke={stroke}
        strokeWidth={1.5}
      />
      {/* Padlock shackle */}
      <Path
        d="M29 28 L29 24 Q29 20 32 20 Q35 20 35 24 L35 28"
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
