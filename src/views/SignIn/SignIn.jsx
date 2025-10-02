import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { usersDB } from '../../utils/handleDB';
import { PasswordInput } from '../../ui/PasswordInput/PasswordInput';
import { LanguageContext } from "../../contexts/contextLanguage";
import LanguageSwitcher from "../../ui/LanguageSwitcher/LanguageSwitcher";

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
      }, 1500);

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