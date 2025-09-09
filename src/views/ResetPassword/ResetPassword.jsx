import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';

import { usersDB } from '../../utils/handleDB';
import { hashPassword } from '../../utils/hashPassword';
import { PasswordInput } from '../../ui/PasswordInput/PasswordInput';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Проверяем, пришли ли мы напрямую или через страницу входа
  useEffect(() => {
    // Проверяем, есть ли в sessionStorage флаг, что мы пришли со страницы входа
    const fromSignIn = sessionStorage.getItem('fromSignIn');
    
    if (!fromSignIn) {
      navigate(-1);
    } else {
      // Очищаем флаг после использования
      sessionStorage.removeItem('fromSignIn');
    }
  }, []);

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

    if (formData.newPassword && formData.newPassword.length < 6) {
      setMessage('Новый пароль должен содержать минимум 6 символов');
      setIsError(true);
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Пароли не совпадают');
      setIsError(true);
      return false;
    }

    return true;
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.email) {
      setMessage('Введите email адрес');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Введите корректный email адрес');
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Проверяем существование пользователя
      const user = await usersDB.getByEmail(formData.email);

      if (!user) {
        setMessage('Пользователь с таким email не найден');
        setIsError(true);
        setIsLoading(false);
        return;
      }

      // В реальном приложении здесь бы отправлялось письмо
      setIsError(false);
      setEmailSent(true);
      setMessage('');

    } catch (error) {
      console.error('Ошибка при отправке email:', error);
      setMessage('Произошла ошибка. Попробуйте позже.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Находим пользователя по email
      const user = await usersDB.getByEmail(formData.email);

      if (!user) {
        setMessage('Пользователь с таким email не найден');
        setIsError(true);
        setIsLoading(false);
        return;
      }

      // Хэшируем новый пароль
      const passwordHash = await hashPassword(formData.newPassword);

      // Обновляем пароль
      await usersDB.update(user.id, { 
        passwordHash: passwordHash,
        lastLogin: null // Сбрасываем сессию
      });

      setMessage('Пароль успешно изменен! Теперь вы можете войти с новым паролем.');
      setIsError(false);
      
      // Очищаем форму
      setFormData({
        email: '',
        newPassword: '',
        confirmPassword: ''
      });
      setEmailSent(false);

    } catch (error) {
      console.error('Ошибка при сбросе пароля:', error);
      setMessage('Произошла ошибка при изменении пароля. Попробуйте позже.');
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
        marginBottom: '10px',
        fontSize: '24px'
      }}>
        {emailSent ? 'Смена пароля' : 'Восстановление пароля'}
      </h2>

      {!emailSent ? (
        <>
          <p style={{ 
            textAlign: 'center', 
            color: '#666', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            Введите ваш email для верификации и восстановления пароля
          </p>
          
          <form onSubmit={handleSendEmail} style={{ padding: '0' }}>
            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="email" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                color: '#555',
                fontSize: '14px'
              }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                placeholder="Введите ваш email"
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
              {isLoading ? 'Отправка...' : 'Верефицировать'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p style={{ 
            textAlign: 'center', 
            color: '#666', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            Введите новый пароль для вашего аккаунта
          </p>
          
          <form onSubmit={handleResetPassword} style={{ padding: '0' }}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="newPassword" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold', 
                color: '#555',
                fontSize: '14px'
              }}>
                Новый пароль 
              </label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Введите новый пароль"
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
                Подтверждение пароля <span style={{ color: '#c62828' }}>*</span>
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Повторите новый пароль"
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
                backgroundColor: isLoading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => !isLoading && (e.target.style.backgroundColor = '#218838')}
              onMouseOut={(e) => !isLoading && (e.target.style.backgroundColor = '#28a745')}
              onMouseDown={(e) => !isLoading && (e.target.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => !isLoading && (e.target.style.transform = 'scale(1)')}
            >
              {isLoading ? 'Смена пароля...' : 'Сменить пароль'}
            </button>
          </form>
        </>
      )}

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

      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        <a href="#sign-in" style={{
          color: '#007bff',
          textDecoration: 'none'
        }}>
          Вернуться к входу
        </a>
      </div>
    </div>
  );
};