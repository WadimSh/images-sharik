import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    sessionStorage.removeItem('searchData');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminProtectedRoute;