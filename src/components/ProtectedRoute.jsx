import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Checking authentication...</div>
      </div>
    );
  }

  if (!user) {
    return <Login redirectTo={location.pathname} />;
  }

  return <Outlet />;
}
