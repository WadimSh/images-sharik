import { useContext } from 'react';
import { LanguageContext } from '../../context/contextLanguage';
import { FaGlobe } from 'react-icons/fa';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, t } = useContext(LanguageContext);

  const languages = [
    { code: 'ru', name: 'switcher.ru' },
    { code: 'it', name: 'switcher.it' },
    { code: 'en', name: 'switcher.en' },
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
            {t(`${lang.name}`)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher; 