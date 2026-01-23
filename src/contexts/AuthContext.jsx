import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const USER_ROLES = {
  UPLOADER: "69732b81f7e443bd673e7575",
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUploader, setIsUploader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();

  // Функция для проверки, является ли пользователь администратором
  const checkIsAdmin = (userData) => {
    if (!userData || !userData.adminCompanies || userData.adminCompanies.length === 0) {
      return false;
    }

    const userCompanyId = userData.company?.[0]?.id;
    const userRoleId = userData.roles?.[0]?.id;

    if (!userCompanyId || !userRoleId) {
      return false;
    }

    const isAdminUser = userData.adminCompanies.some(adminCompany => 
      adminCompany.company === userCompanyId && adminCompany.role === userRoleId
    );

    return isAdminUser;
  };

  const checkIsUploader = (userData) => {
    return userData?.roles?.some(role => role.id === USER_ROLES.UPLOADER) || false;
  };

  // Проверяем сохраненные данные при инициализации
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setIsAdmin(checkIsAdmin(parsedUser));
          setIsUploader(checkIsUploader(parsedUser));
        }
      } catch (error) {
        console.error('Error restoring auth:', error);
        logout();
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

      const adminStatus = checkIsAdmin(userData);
      const uploader = checkIsUploader(userData);
      
      // Обновляем контекст
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(adminStatus);
      setIsUploader(uploader);
      
      return { user: userData, isAdmin: adminStatus };
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
      setIsAdmin(false);
      setIsUploader(false);
      
      // Перенаправляем на страницу входа
      navigate('/sign-in', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsAdmin(checkIsAdmin(updateUser));
      setIsUploader(checkIsUploader(updateUser))
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Хелпер-функция для получения администраторских компаний текущего пользователя
  const getAdminCompaniesForCurrentUser = () => {
    if (!user || !user.adminCompanies || user.adminCompanies.length === 0) {
      return [];
    }

    const userCompanyId = user.company?.[0]?.id;
    const userRoleId = user.roles?.[0]?.id;

    if (!userCompanyId || !userRoleId) {
      return [];
    }

    // Фильтруем adminCompanies по совпадению company и role
    return user.adminCompanies.filter(adminCompany => 
      adminCompany.company === userCompanyId && adminCompany.role === userRoleId
    );
  };

  // Хелпер-функция для проверки, является ли пользователь администратором конкретной компании
  const isAdminOfCompany = (companyId) => {
    if (!user || !companyId) return false;
    
    const userRoleId = user.roles?.[0]?.id;
    if (!userRoleId) return false;

    return user.adminCompanies?.some(adminCompany => 
      adminCompany.company === companyId && adminCompany.role === userRoleId
    ) || false;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout, 
        updateUser,
        isAdmin,
        isUploader,
        getAdminCompaniesForCurrentUser,
        isAdminOfCompany
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