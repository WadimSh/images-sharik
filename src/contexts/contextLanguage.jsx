import React, { createContext, useState, useEffect } from 'react';
import en from '../assets/lang/en.json';
import ru from '../assets/lang/ru.json';
import it from '../assets/lang/it.json';
import de from '../assets/lang/de.json';

export const LanguageContext = createContext();

const languages = {
  en,
  ru,
  it,
  de
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('ru'); // Язык по умолчанию
  const [translations, setTranslations] = useState(languages.ru);

  useEffect(() => {
    // Получаем язык выбранный на браузере
    const browserLang = navigator.language.split('-')[0];
    
    // Проверяем, поддерживается ли язык браузера, в противном случае используйте русский
    const initialLang = Object.keys(languages).includes(browserLang) ? browserLang : 'ru';
    
    setCurrentLanguage(initialLang);
    setTranslations(languages[initialLang]);
  }, []);

  const changeLanguage = (lang) => {
    if (languages[lang]) {
      setCurrentLanguage(lang);
      setTranslations(languages[lang]);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value[k] === undefined) {
        console.warn(`Translation key "${key}" not found`);
        return key;
      }
      value = value[k];
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 