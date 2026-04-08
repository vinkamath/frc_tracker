import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
      className={cn(
        'relative pb-0.5 text-sm font-medium transition-opacity duration-200 ease-out after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 motion-reduce:after:transition-none',
        isActive ? 'font-semibold after:scale-x-100' : 'after:scale-x-0'
      )}
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
    <nav className="sticky top-0 z-50 w-full border-b border-background/10 bg-foreground text-background shadow-[0_1px_0_color-mix(in_oklch,var(--primary)_35%,transparent)]">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <img src={logo} alt="FRC Mumbai" className="h-9 w-auto shrink-0 sm:h-10" />
          <h1 className="font-display truncate text-lg font-bold tracking-tight sm:text-xl">
            FRC Mumbai
          </h1>
        </div>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-7 sm:flex">
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

      {/* Mobile menu — grid rows avoids animating raw height */}
      <div
        className={cn(
          'grid overflow-hidden border-t border-white/20 transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:hidden',
          menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="flex flex-col gap-2 px-4 py-4">{navLinks}</ul>
        </div>
      </div>
    </nav>
  );
}

function LayoutWithNav() {
  const location = useLocation();
  return (
    <>
      <Nav />
      <main
        key={location.pathname}
        className="app-shell min-h-[calc(100vh-4.25rem)] pb-12 motion-safe:page-enter"
      >
        <Outlet />
      </main>
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
