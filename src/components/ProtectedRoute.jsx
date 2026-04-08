import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center px-4">
        <p className="font-medium text-muted-foreground motion-safe:animate-pulse motion-reduce:animate-none">
          Checking authentication…
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login redirectTo={location.pathname} />;
  }

  return <Outlet />;
}
