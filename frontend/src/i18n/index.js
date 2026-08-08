import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import uz from './locales/uz.json'
import ru from './locales/ru.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
    },
    // Default language — Uzbek
    fallbackLng: 'uz',
    // Language detection order: localStorage → browser language
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'malum_lang',
    },
    interpolation: {
      escapeValue: false, // React escapes by default
    },
  })

export default i18n
