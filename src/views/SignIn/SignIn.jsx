import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { PasswordInput } from '../../ui/PasswordInput/PasswordInput';
import { LanguageContext } from "../../contexts/contextLanguage";
import LanguageSwitcher from "../../ui/LanguageSwitcher/LanguageSwitcher";
import { apiSignIn } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

export const SignIn = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Введите корректный email адрес');
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
    setMessage('');
    setIsError(false);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await apiSignIn({
        email: formData.email,
        password: formData.password
      });

      login(result);

      if (result.user.company[0].id) {
        localStorage.setItem('company', result.user.company[0].id);
      }
        
      // Очищаем форму
      setFormData({ login: '', password: ''});
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      console.error('Error when logging in:', error);
      setMessage(error.response?.status === 401 
        ? 'auth.invalidCredentials' 
        : 'auth.signInError'
      );
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