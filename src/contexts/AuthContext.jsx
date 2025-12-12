import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Для проверки начального состояния

  // Проверяем сохраненные данные при инициализации
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error restoring auth:', error);
        //logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = (authData) => {
    try {
      const { accessToken, user: userData } = authData;
      
      // Сохраняем токен
      localStorage.setItem('accessToken', accessToken);
      
      // Сохраняем данные пользователя
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Обновляем контекст
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      // Очищаем локальное хранилище
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
            
      // Обновляем состояние
      setUser(null);
      setIsAuthenticated(false);
      
      // Перенаправляем на страницу входа
      //window.location.href = '/sign-in';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout, 
        updateUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};