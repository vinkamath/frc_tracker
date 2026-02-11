import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import CheckIn from './components/CheckIn';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import History from './components/History';
import { Button } from './components/ui/button';
import logo from './assets/logo.png';

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`font-medium transition-colors hover:opacity-90 ${
        isActive ? 'border-b-2 border-white pb-1' : ''
      }`}
    >
      {children}
    </Link>
  );
}

function Nav() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-foreground text-background shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl flex-col items-center justify-between gap-4 px-4 py-3 sm:flex-row sm:px-6">
        <div className="flex items-center gap-4">
          <img src={logo} alt="FRC Mumbai" className="h-9 w-auto sm:h-10" />
          <h1 className="text-base font-semibold sm:text-lg">FRC Mumbai</h1>
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <li><NavLink to="/">Check In</NavLink></li>
          <li><NavLink to="/dashboard">Dashboard</NavLink></li>
          <li><NavLink to="/members">Members</NavLink></li>
          <li><NavLink to="/history">History</NavLink></li>
          <li>
            <Button variant="secondary" size="sm" onClick={handleSignOut} className="bg-white/10 text-white hover:bg-white/20">
              Sign Out
            </Button>
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
              <Route path="/history" element={<History />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
