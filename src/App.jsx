import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import CheckIn from './components/CheckIn';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import History from './components/History';
import logo from './assets/logo.png';

function Nav() {
  const location = useLocation();

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
            <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>
              History
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Nav />
      <Routes>
        <Route path="/" element={<CheckIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;
