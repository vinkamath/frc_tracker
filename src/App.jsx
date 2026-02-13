import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import CheckIn from './components/CheckIn';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import History from './components/History';
import { Button } from './components/ui/button';
import logo from './assets/logo.png';

function NavLink({ to, children, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`font-medium transition-colors hover:opacity-90 ${
        isActive ? 'border-b-2 border-white pb-1' : ''
      }`}
    >
      {children}
    </Link>
  );
}

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  const navLinks = (
    <>
      <li><NavLink to="/" onClick={closeMenu}>Check In</NavLink></li>
      <li><NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink></li>
      <li><NavLink to="/members" onClick={closeMenu}>Members</NavLink></li>
      <li><NavLink to="/history" onClick={closeMenu}>History</NavLink></li>
      <li>
        <Button variant="secondary" size="sm" onClick={handleSignOut} className="bg-white/10 text-white hover:bg-white/20">
          Sign Out
        </Button>
      </li>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-foreground text-background shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <img src={logo} alt="FRC Mumbai" className="h-9 w-auto sm:h-10" />
          <h1 className="text-base font-semibold sm:text-lg">FRC Mumbai</h1>
        </div>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 sm:flex">
          {navLinks}
        </ul>

        {/* Mobile hamburger button */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden text-white hover:bg-white/10"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="border-t border-white/20 sm:hidden">
          <ul className="flex flex-col gap-2 px-4 py-4">
            {navLinks}
          </ul>
        </div>
      )}
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
