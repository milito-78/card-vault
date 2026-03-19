import { useRef } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const CLEAR_DELAY_MS = 60_000; // 60 seconds

export function useCopyWithClear() {
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copyWithClear(value: string, label = 'Value') {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to clipboard. Will clear in 60 seconds.`);

    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }

    clearTimeoutRef.current = setTimeout(async () => {
      await Clipboard.setStringAsync('');
      clearTimeoutRef.current = null;
    }, CLEAR_DELAY_MS);
  }

  return { copyWithClear };
}
