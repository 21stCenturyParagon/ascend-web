import './index.css';
import Landing from './pages/Landing';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import LoggedInRegistration from './pages/LoggedInRegistration';
import AdminReview from './pages/AdminReview';
import Rulebook from './pages/Rulebook';
import Rulebook2 from './pages/Rulebook2';
import PulsarXWaimersRulebook from './pages/PulsarXWaimersRulebook';
// Lazy import type issues can occur; use direct import
import AdminLogin from './pages/AdminLogin.tsx';
import TemplateBuilder from './pages/TemplateBuilder';
import UseTemplate from './pages/UseTemplate';
import TemplateDashboard from './pages/TemplateDashboard';

function getPath(): string {
  try {
    return window.location.pathname || '/';
  } catch {
    return '/';
  }
}

export default function App() {
  const path = getPath();
  if (path === '/templates') return <TemplateDashboard />;
  if (path === '/templates/new') return <TemplateBuilder />;
  if (path.startsWith('/templates/') && path.endsWith('/use')) {
    return <UseTemplate />;
  }
  if (path === '/auth/callback') return <AuthCallback />;
  if (path === '/register/details') return <LoggedInRegistration />;
  if (path === '/register') return <Register />;
  if (path === '/rulebook') return <Rulebook />;
  if (path === '/breakpointseries/rulebook') return <Rulebook2 />;
  if (path === '/pulsarxwaimers/rulebook') return <PulsarXWaimersRulebook />;
  if (path.startsWith('/admin/review')) return <AdminReview />;
  if (path.startsWith('/admin/login')) return <AdminLogin />;
  return <Landing />;
}
