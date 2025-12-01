import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

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

  if (!isAuthenticated) {
    sessionStorage.removeItem('searchData');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;