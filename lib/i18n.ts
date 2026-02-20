/**
 * Конфигурация интернационализации (i18n).
 * Использует i18next + react-i18next, сохраняет язык в AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from '../locales/ru.json';
import en from '../locales/en.json';

const LANGUAGE_KEY = '@gonext_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lng: string) => void) => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored) {
        callback(stored);
      } else {
        callback('ru');
      }
    });
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    AsyncStorage.setItem(LANGUAGE_KEY, lng);
  },
};

export const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export async function setLanguage(lng: LanguageCode): Promise<void> {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_KEY, lng);
}

export async function initI18n(): Promise<void> {
  await i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        ru: { translation: ru },
        en: { translation: en },
      },
      fallbackLng: 'ru',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
