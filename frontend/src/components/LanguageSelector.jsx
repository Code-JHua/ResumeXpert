import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const baseStyles = {
  background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
};

const variants = {
  default: {
    minWidth: '60px',
    gap: '6px',
  },
  compact: {
    minWidth: 'auto',
    gap: '0',
  },
};

const LanguageSelector = ({ className = '', variant = 'default' }) => {
  const { i18n, t } = useTranslation();
  const currentVariant = variants[variant] || variants.default;

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
        ...baseStyles,
        ...currentVariant,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(139, 92, 246, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      aria-label={t('common.language')}
    >
      <Languages size={16} />
      {variant !== 'compact' && <span>{t(`language.${i18n.language}`)}</span>}
    </button>
  );
};

export default LanguageSelector;
