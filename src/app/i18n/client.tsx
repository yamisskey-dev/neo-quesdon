'use client';

import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { getOptions } from './settings';
import jaTranslation from '@/location/ja/translation.json';
import enTranslation from '@/location/en/translation.json';
import koTranslation from '@/location/ko/translation.json';

// Create i18n instance
const i18nInstance = i18next.createInstance();

i18nInstance
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: jaTranslation },
      en: { translation: enTranslation },
      ko: { translation: koTranslation }
    },
    ...getOptions(),
    interpolation: { escapeValue: false }
  });

export function I18nProvider({
  children,
  lng
}: {
  children: React.ReactNode;
  lng: string;
}) {
  i18nInstance.changeLanguage(lng);
  return (
    <I18nextProvider i18n={i18nInstance}>
      {children}
    </I18nextProvider>
  );
}