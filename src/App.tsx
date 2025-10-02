import './index.css';
import Landing from './pages/Landing';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import LoggedInRegistration from './pages/LoggedInRegistration';

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
  return <Landing />;
}
