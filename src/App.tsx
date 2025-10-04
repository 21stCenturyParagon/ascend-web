import './index.css';
import Landing from './pages/Landing';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import LoggedInRegistration from './pages/LoggedInRegistration';
import AdminReview from './pages/AdminReview';
import Rulebook from './pages/Rulebook';
// Lazy import type issues can occur; use direct import
import AdminLogin from './pages/AdminLogin.tsx';

function getPath(): string {
  try {
    return window.location.pathname || '/';
  } catch {
    return '/';
  }
}

export default function App() {
  const path = getPath();
  if (path === '/auth/callback') return <AuthCallback />;
  if (path === '/register/details') return <LoggedInRegistration />;
  if (path === '/register') return <Register />;
  if (path === '/rulebook') return <Rulebook />;
  if (path.startsWith('/admin/review')) return <AdminReview />;
  if (path.startsWith('/admin/login')) return <AdminLogin />;
  return <Landing />;
}
