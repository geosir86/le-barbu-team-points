import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: localStorage.getItem('app-language') || 'el',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    debug: false,
  });

export default i18n;