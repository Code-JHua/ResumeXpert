import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSelector = ({ className = '' }) => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
    localStorage.setItem('resumexpert-language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`relative px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
        color: 'white',
        minWidth: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(139, 92, 246, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Languages size={16} />
      <span>{t(`language.${i18n.language}`)}</span>
    </button>
  );
};

export default LanguageSelector;
