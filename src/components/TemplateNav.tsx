import { useEffect, useState } from 'react';
import { getSupabase, signInWithDiscord, signOut } from '../lib/supabase';

type User = { id: string; email?: string } | null;

export default function TemplateNav() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const client = getSupabase();
        const { data } = await client.auth.getSession();
        setUser(data.session?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const isActive = (path: string) => {
    if (path === '/templates') {
      return currentPath === '/templates';
    }
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/templates';
  };

  return (
    <nav style={navStyle}>
      <div style={navInner}>
        <div style={logoSection}>
          <a href="/templates" style={logoStyle}>
            📋 Template Builder
          </a>
        </div>

        <div style={navLinks}>
          <a
            href="/templates"
            style={{
              ...linkStyle,
              ...(isActive('/templates') && !currentPath.includes('/new') ? activeLinkStyle : {}),
            }}
          >
            Browse Templates
          </a>
          <a
            href="/templates/new"
            style={{
              ...linkStyle,
              ...(isActive('/templates/new') ? activeLinkStyle : {}),
            }}
          >
            Create New
          </a>
        </div>

        <div style={authSection}>
          {loading ? (
            <span style={{ color: '#6b7280', fontSize: 14 }}>...</span>
          ) : user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#6b7280', fontSize: 14 }}>
                {user.email?.split('@')[0] ?? 'User'}
              </span>
              <button onClick={handleSignOut} style={signOutButton}>
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => signInWithDiscord('/templates')} style={signInButton}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

const navStyle: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #e5e7eb',
  padding: '0 16px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const navInner: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: 1200,
  margin: '0 auto',
  height: 56,
};

const logoSection: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const logoStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#0f172a',
  textDecoration: 'none',
};

const navLinks: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const linkStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 6,
  color: '#475569',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  transition: 'all 0.15s',
};

const activeLinkStyle: React.CSSProperties = {
  background: '#eff6ff',
  color: '#2563eb',
};

const authSection: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const signInButton: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '8px 16px',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
};

const signOutButton: React.CSSProperties = {
  background: 'transparent',
  color: '#6b7280',
  padding: '6px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
};

