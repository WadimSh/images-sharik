import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersDB } from '../../utils/handleDB';
import { PasswordInput } from '../../ui/PasswordInput/PasswordInput';

export const SignIn = () => {
  const navigate = useNavigate();
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
      setMessage('Логин должен содержать минимум 3 символа');
      setIsError(true);
      return false;
    }

    if (formData.password.length < 6) {
      setMessage('Пароль должен содержать минимум 6 символов');
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
        setMessage('Неверный логин или пароль');
        setIsError(true);
        setIsLoading(false);
        return;
      }

      // Обновляем время последнего входа
      await usersDB.update(user.id, { lastLogin: new Date() });

      setMessage('Вход выполнен успешно!');
      setIsError(false);

      // Сохраняем информацию о пользователе в localStorage/sessionStorage
      //localStorage.setItem('currentUser', JSON.stringify({
      //  id: user.id,
      //  login: user.login,
      //  email: user.email
      //}));
      
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
      console.error('Ошибка при входе:', error);
      setMessage('Произошла ошибка при входе. Попробуйте позже.');
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
      <h2 style={{ 
        textAlign: 'center', 
        color: '#333', 
        marginBottom: '30px',
        fontSize: '24px'
      }}>
        Вход в систему
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
            Логин *
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
            placeholder="Введите ваш логин"
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
            Пароль *
          </label>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Введите ваш пароль"
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
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        <a href="#sign-up" style={{
          color: '#007bff',
          textDecoration: 'none',
          marginRight: '8px'
        }}>
          Зарегистрироваться? 
        </a>

        <a href="#reset-password" style={{
          color: '#007bff',
          textDecoration: 'none'
        }}>
          Забыли пароль?
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
          {message}
        </div>
      )}
    </div>
  );
};