import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

const i18n = new I18n({ en, ar });

type LocaleContextType = {
  t: (key: string, options?: Record<string, string>) => string;
  locale: string;
  isRTL: boolean;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const locales = Localization.getLocales();
    const preferred = locales?.[0]?.languageTag?.split('-')[0] ?? 'en';
    const supported = ['en', 'ar'];
    const resolved = supported.includes(preferred) ? preferred : 'en';
    setLocale(resolved);
    i18n.locale = resolved;
    i18n.defaultLocale = 'en';
    i18n.enableFallback = true;
  }, []);

  const value = useMemo(
    () => ({
      t: (key: string, options?: Record<string, string>) => {
        const result = i18n.t(key, options);
        return typeof result === 'string' ? result : key;
      },
      locale,
      isRTL: false, // RTL would require I18nManager.forceRTL + app restart
    }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
