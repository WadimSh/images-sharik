import { useContext } from 'react';
import { FaGlobe } from 'react-icons/fa';

import { LanguageContext } from '../../context/contextLanguage';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, t } = useContext(LanguageContext);

  const languages = [
    { code: 'ru', name: 'ui.ru' },
    { code: 'it', name: 'ui.it' },
    { code: 'en', name: 'ui.en' },
  ];

  return (
    <div className="language-switcher">
      <FaGlobe className="language-icon" />
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {t(lang.name)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher; 