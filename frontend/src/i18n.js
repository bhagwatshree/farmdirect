import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      ta: { translation: ta },
      te: { translation: te },
      kn: { translation: kn },
    },
    lng: localStorage.getItem('lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
