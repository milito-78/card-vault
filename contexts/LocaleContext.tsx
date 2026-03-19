import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';
import fa from '@/locales/fa.json';
import * as storage from '@/services/storage';

const i18n = new I18n({ en, ar, fa });

export type Locale = 'en' | 'ar' | 'fa';

type LocaleContextType = {
  t: (key: string, options?: Record<string, string>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  isRTL: boolean;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const saved = await storage.getLocale();
      if (cancelled) return;
      if (saved) {
        setLocaleState(saved);
        i18n.locale = saved;
      } else {
        const locales = Localization.getLocales();
        const preferred = locales?.[0]?.languageTag?.split('-')[0] ?? 'en';
        const supported: Locale[] = ['en', 'ar', 'fa'];
        const resolved = supported.includes(preferred as Locale) ? (preferred as Locale) : 'en';
        setLocaleState(resolved);
        i18n.locale = resolved;
      }
      i18n.defaultLocale = 'en';
      i18n.enableFallback = true;
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const setLocale = async (newLocale: Locale) => {
    await storage.setLocale(newLocale);
    setLocaleState(newLocale);
    i18n.locale = newLocale;
  };

  const value = useMemo(
    () => ({
      t: (key: string, options?: Record<string, string>) => {
        const result = i18n.t(key, options);
        return typeof result === 'string' ? result : key;
      },
      locale,
      setLocale,
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
