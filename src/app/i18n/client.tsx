'use client';

import { createInstance } from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from './settings';

const i18nInstance = createInstance();

i18nInstance
  .use(initReactI18next)
  .use(resourcesToBackend((language: string, namespace: string) => 
    // Using relative path from project root
    import(`@/location/${language}/${namespace}.json`)
  ));

export function I18nProvider({
  children,
  lng
}: {
  children: React.ReactNode;
  lng: string;
}) {
  i18nInstance.init({
    ...getOptions(),
    lng,
    preload: [lng]
  });

  return (
    <I18nextProvider i18n={i18nInstance}>
      {children}
    </I18nextProvider>
  );
}