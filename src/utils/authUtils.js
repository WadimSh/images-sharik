// Проверка авторизации пользователя
export const isAuthenticated = () => {
  const userData = localStorage.getItem('currentUser');
  return !!userData;
};

// Получение данных текущего пользователя
export const getCurrentUser = () => {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
};

// Выход из системы
export const logout = () => {
  localStorage.removeItem('currentUser');
  // Дополнительно можно очистить другие данные сессии
};

// Проверка ролей пользователя (если нужно)
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};