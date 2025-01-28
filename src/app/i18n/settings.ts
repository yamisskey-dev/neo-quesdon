export const fallbackLng = 'ja';
export const languages = ['ja', 'en', 'ko'];

export function getOptions(lng = fallbackLng) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    defaultNS: 'translation'
  };
}