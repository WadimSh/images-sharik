import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { usersDB } from '../../utils/handleDB';
import { hashPassword } from '../../utils/hashPassword';
import { PasswordInput } from '../../ui/PasswordInput/PasswordInput';
import { LanguageContext } from "../../contexts/contextLanguage";
import LanguageSwitcher from "../../ui/LanguageSwitcher/LanguageSwitcher";

export const SignUp = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkUsers = async () => {
      try {
        const users = await usersDB.getAll();
        if (users.length > 0) {
          navigate('/'); // Перенаправляем на главную, если есть пользователи
        }
      } catch (error) {
        console.error('Error checking users:', error);
      } 
    };

    checkUsers();
  }, [navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Сброс предыдущих сообщений
    setMessage('');
    setIsError(false);

    if (formData.login.length < 3) {
      setMessage('auth.loginLength');
      setIsError(true);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('auth.emailInvalid');
      setIsError(true);
      return false;
    }

    if (formData.password.length < 6) {
      setMessage('auth.passwordLength');
      setIsError(true);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('auth.passwordsNotMatch');
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
      // Проверяем существование пользователя
      const existingByLogin = await usersDB.getByLogin(formData.login);
      const existingByEmail = await usersDB.getByEmail(formData.email);

      if (existingByLogin) {
        setMessage('auth.loginExists');
        setIsError(true);
        setIsLoading(false);
        return;
      }

      if (existingByEmail) {
        setMessage('auth.emailExists');
        setIsError(true);
        setIsLoading(false);
        return;
      }

      // Хэшируем пароль
      const passwordHash = await hashPassword(formData.password);

      // Добавляем нового пользователя
      await usersDB.add({
        login: formData.login.trim(),
        email: formData.email.trim().toLowerCase(),
        passwordHash: passwordHash,
        createdAt: new Date(),
        lastLogin: new Date(),
        isActive: true
      });

      setMessage('auth.registrationSuccess');
      setIsError(false);

      setTimeout(() => {
        navigate('/');
      }, 500);
      
      // Очищаем форму
      setFormData({
        login: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Registration error:', error);
      setMessage('auth.registrationFailed');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
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
        fontSize: '24px'
      }}>
        {t('auth.title')}
      </h2>
      <p style={{ 
        textAlign: 'center', 
        color: '#555', 
        marginBottom: '30px',
        fontSize: '16px'
      }}>
        {t('auth.subtitle')}
      </p>
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

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            color: '#555',
            fontSize: '14px'
          }}>
            {t('auth.emailLabel')} <span style={{ color: '#c62828' }}>*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            placeholder={t('auth.emailPlaceholder')}
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

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            color: '#555',
            fontSize: '14px'
          }}>
            {t('auth.passwordLabel')} <span style={{ color: '#c62828' }}>*</span> {t('auth.passwordHint')}
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

        <div style={{ marginBottom: '25px' }}>
          <label htmlFor="confirmPassword" style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            color: '#555',
            fontSize: '14px'
          }}>
            {t('auth.confirmPasswordLabel')} <span style={{ color: '#c62828' }}>*</span>
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={t('auth.confirmPasswordPlaceholder')}
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
            transition: 'background-color 0.2s, transform 0.1s'
          }}
          onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#0056b3')}
          onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = '#007bff')}
          onMouseDown={(e) => !isLoading && (e.target.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => !isLoading && (e.target.style.transform = 'scale(1)')}
        >
          {isLoading ? t('auth.registering') : t('auth.registerButton')}
        </button>
      </form>

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