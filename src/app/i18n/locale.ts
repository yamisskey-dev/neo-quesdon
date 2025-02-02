import { fallbackLng } from './settings';
import type { i18n } from 'i18next';

export const LOCALES = {
  'ja': 'ja-JP',
  'en': 'en-US',
  'ko': 'ko-KR'
} as const;

export type ValidLocale = (typeof LOCALES)[keyof typeof LOCALES];

export const getI18nLocale = (i18n: i18n): ValidLocale => {
  const lang = i18n.language.split('-')[0];
  return LOCALES[lang as keyof typeof LOCALES] || LOCALES[fallbackLng];
};