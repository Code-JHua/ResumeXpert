import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译文件
import zhTranslation from './locales/zh/translation.json';
import enTranslation from './locales/en/translation.json';

const resources = {
  zh: {
    translation: zhTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 绑定react-i18next
  .init({
    resources,
    fallbackLng: 'en', // 默认语言为英文
    lng: localStorage.getItem('resumexpert-language') || 'en', // 优先使用localStorage中的语言

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'resumexpert-language'
    },

    interpolation: {
      escapeValue: false // React已经防止XSS
    },

    react: {
      useSuspense: false // 禁用Suspense，避免加载问题
    }
  });

export default i18n;
