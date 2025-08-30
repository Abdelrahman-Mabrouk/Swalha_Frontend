import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { currentLanguage, toggleLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={toggleLanguage}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors duration-200"
        title={t('common.language')}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden md:block">{currentLang?.flag}</span>
        <span className="hidden lg:block">{currentLang?.name}</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
