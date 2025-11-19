import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { usersDB, historyDB } from '../../utils/handleDB';
import { syncUserToBackend } from '../../services/temporaryService';
import { PasswordInput } from '../../ui/PasswordInput/PasswordInput';
import { LanguageContext } from "../../contexts/contextLanguage";
import LanguageSwitcher from "../../ui/LanguageSwitcher/LanguageSwitcher";
import { apiSignIn } from '../../services/authService';
import { apiCreateHistoriy } from '../../services/historiesService';

// Парсит код истории для извлечения articles, marketplace, type, size
// Артикулы разделены подчеркиванием, каждый артикул может содержать дефисы
const parseHistoryCode = (code) => {
  const parts = code.split('_');
  
  if (parts.length < 6) {
    return {
      articles: [],
      marketplace: '',
      type: 'unknown',
      size: ''
    };
  }
  
  // Определяем индекс типа (collage, main, slideX)
  let typeIndex = -1;
  let type = 'unknown';
  
  // Ищем тип дизайна
  if (parts.includes('collage')) {
    typeIndex = parts.indexOf('collage');
    type = 'collage';
  } else if (parts.includes('main')) {
    typeIndex = parts.indexOf('main');
    type = 'main';
  } else {
    // Ищем любой слайд (slideX)
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith('slide')) {
        typeIndex = i;
        type = parts[i]; // сохраняем как "slide1", "slide2" и т.д.
        break;
      }
    }
  }
  
  // Если не нашли тип, возвращаем значения по умолчанию
  if (typeIndex === -1) {
    return {
      articles: [],
      marketplace: '',
      type: 'unknown',
      size: ''
    };
  }
  
  // Артикулы - это все части ДО marketplace (то есть до typeIndex - 1)
  const articles = parts.slice(0, typeIndex - 1);
  const marketplace = parts[typeIndex - 1] || '';
  const size = parts[typeIndex + 1] || '';
  
  return {
    articles, // массив артикулов, где каждый элемент - это артикул (может содержать дефисы)
    marketplace,
    type,
    size
  };
};

// Преобразует историю из формата IndexedDB в формат бэкенда
const transformHistoryForBackend = (historyItem) => {
  try {
    const { code, data } = historyItem;
    
    // Парсим код для извлечения дополнительных полей
    const parsedInfo = parseHistoryCode(code);
    
    // Формируем объект для бэкенда
    return {
      name: code, // code становится name
      data: data, // data остается как есть
      company: localStorage.getItem('company'), // ID компании из localStorage
      articles: parsedInfo.articles,
      marketplace: parsedInfo.marketplace,
      type: parsedInfo.type,
      size: parsedInfo.size
    };
  } catch (error) {
    console.error('Ошибка преобразования истории:', error, historyItem);
    return null;
  }
};

export const SignIn = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    setMessage('');
    setIsError(false);

    if (formData.login.length < 3) {
      setMessage('auth.loginLength');
      setIsError(true);
      return false;
    }

    if (formData.password.length < 6) {
      setMessage('auth.passwordLength');
      setIsError(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Проверяем учетные данные
      const user = await usersDB.verifyCredentials(formData.login, formData.password);

      if (!user) {
        setMessage('auth.invalidCredentials');
        setIsError(true);
        setIsLoading(false);
        return;
      }
      
      // Проверяем флаг синхронизации конкретного пользователя
      const isUserSynced = await usersDB.getSyncFlag(user.id);
      
      // Если флага нет - отправляем данные на сервер
      if (!isUserSynced) {
        try {
          // Берем данные пользователя из базы
          const userData = {
            username: user.login,
            email: user.email,
            password: formData.password // используем введенный пароль
          };
      
          // Отправляем на сервер
          await syncUserToBackend(userData);
          
          // Если успешно - выставляем флаг для этого пользователя
          await usersDB.setSyncFlag(user.id, true);
          console.log('User data synced to backend successfully');
          
        } catch (syncError) {
          // Если ошибка - просто логируем и продолжаем работу
          console.warn('Failed to sync user to backend, continuing with local auth:', syncError);
          // НЕ блокируем пользователя, продолжаем как обычно
        }
      } else {
        // Если флаг есть - авторизовываемся на бекенде
        try {
          const result = await apiSignIn({
            email: user.email,
            password: formData.password
          });

          if (result.user.company[0].id) {
            localStorage.setItem('company', result.user.company[0].id);
          }

          // Проверяем флаг миграции историй
          const isHistoryMigration = await usersDB.getHistoryMigrationFlag(user.id);
          
          // Если флага нет
          if (!isHistoryMigration) {
            try {
              // Получаем все записи из таблицы history
              const allHistoryItems = await historyDB.getAll();

              console.log(`Найдено ${allHistoryItems.length} историй для миграции`);

              // Преобразуем и отправляем истории
              const historiesToMigrate = allHistoryItems.map(historyItem => {
                return transformHistoryForBackend(historyItem);
              }).filter(Boolean);
            
              let successCount = 0;
              let errorCount = 0;
            
              // Отправляем каждую историю по отдельности
              for (const historyData of historiesToMigrate) {
                try {
                  await apiCreateHistoriy(historyData);
                  successCount++;
                  console.log(`✅ История ${historyData.name} успешно мигрирована`);

                  // Небольшая задержка между запросами
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                  errorCount++;
                  console.warn(`❌ Ошибка при миграции истории ${historyData.name}:`, error);
                }
              }
            
              console.log(`Миграция завершена: ${successCount} успешно, ${errorCount} с ошибками`);
            
              // Устанавливаем флаг, что миграция выполнена (даже если были ошибки)
              await usersDB.setHistoryMigrationFlag(user.id, true);
            
            } catch (migrationError) {
              console.error('Критическая ошибка при миграции историй:', migrationError);
            }
          }
        } catch (authError) {
          console.warn('Failed to sync user to backend, continuing with local auth:', authError);
        }
      }

      // Обновляем время последнего входа
      await usersDB.update(user.id, { lastLogin: new Date() });

      setMessage('auth.signInSuccess');
      setIsError(false);

      // Очищаем форму
      setFormData({
        login: '',
        password: ''
      });

      // Перенаправляем на главную страницу через 1.5 секунды
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (error) {
      console.error('Error when logging in:', error);
      setMessage('auth.signInError');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    sessionStorage.setItem('fromSignIn', 'true');
    navigate('/reset-password');
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '150px auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        position: 'fixed',
        top: '15px',
        right: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        paddingTop: '8px'
      }}>
        <LanguageSwitcher />
      </div>
      
      <h2 style={{ 
        textAlign: 'center', 
        color: '#333', 
        marginBottom: '30px',
        fontSize: '24px'
      }}>
        {t('auth.signInTitle')}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ padding: '0' }}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="login" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            color: '#555',
            fontSize: '14px'
          }}>
            {t('auth.loginLabel')} <span style={{ color: '#c62828' }}>*</span>
          </label>
          <input
            type="text"
            id="login"
            name="login"
            value={formData.login}
            onChange={handleInputChange}
            required
            minLength={3}
            disabled={isLoading}
            placeholder={t('auth.loginPlaceholder')}
            style={{ 
              width: '100%', 
              padding: '12px', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
              fontSize: '16px',
              backgroundColor: isLoading ? '#f5f5f5' : 'white',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label htmlFor="password" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            color: '#555',
            fontSize: '14px'
          }}>
            {t('auth.passwordLabel')} <span style={{ color: '#c62828' }}>*</span>
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder={t('auth.passwordPlaceholder')}
            disabled={isLoading}
            required={true}
            minLength={6}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#0056b3')}
          onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = '#007bff')}
          onMouseDown={(e) => !isLoading && (e.target.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => !isLoading && (e.target.style.transform = 'scale(1)')}
        >
          {isLoading ? t('auth.signingIn') : t('auth.signInButton')}
        </button>
      </form>

      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        <a 
          href="#reset-password" 
          onClick={handleForgotPassword}
          style={{
          color: '#007bff',
          textDecoration: 'none'
        }}>
          {t('auth.forgotPassword')}
        </a>
      </div>

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: isError ? '#ffebee' : '#e8f5e8',
          color: isError ? '#c62828' : '#2e7d32',
          border: `1px solid ${isError ? '#ef9a9a' : '#a5d6a7'}`,
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          {t(message)}
        </div>
      )}
    </div>
  );
};