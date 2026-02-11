import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import CheckIn from './components/CheckIn';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import logo from './assets/logo.png';

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="nav">
      <div className="nav-content">
        <div className="nav-logo">
          <img src={logo} alt="FRC Mumbai" className="logo" />
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Check In
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/members" className={location.pathname === '/members' ? 'active' : ''}>
              Members
            </Link>
          </li>
          <li>
            <button type="button" className="btn btn-secondary" onClick={handleSignOut} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function LayoutWithNav() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<LayoutWithNav />}>
              <Route path="/" element={<CheckIn />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
