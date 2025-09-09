import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usersDB } from '../utils/handleDB';
import { isToday } from '../utils/isToday';

const DBProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const users = await usersDB.getAll();
        
        // Если нет пользователей - перенаправляем на регистрацию
        if (users.length === 0) {
          setRedirectPath('/sign-up');
          setIsChecking(false);
          return;
        }
        
        // Если есть пользователи, проверяем lastLogin
        const currentUser = users[0];
        
        // Проверяем, что lastLogin не сегодня
        if (!isToday(currentUser.lastLogin)) {
          setRedirectPath('/sign-in');
          setIsChecking(false);
          return;
        }
        
        // Если все проверки пройдены - разрешаем доступ
        setRedirectPath(null);
        setIsChecking(false);
        
      } catch (error) {
        console.error('Error checking user authentication:', error);
        setRedirectPath('/sign-up');
        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, []);

  // Пока проверяем, можно показать loader или ничего
  if (isChecking) {
    return <div>Loading...</div>; // или ваш лоадер
  }

  // Если нужно перенаправить
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Если все проверки пройдены - показываем children
  return children;
};

export default DBProtectedRoute;