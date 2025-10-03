import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  function getReturnUrl(): string {
    try {
      // Check if there's a stored return URL in sessionStorage
      const stored = sessionStorage.getItem('auth_return_url');
      if (stored) {
        sessionStorage.removeItem('auth_return_url');
        return stored;
      }
      // Fallback: read from URL query param 'next'
      const u = new URL(window.location.href);
      const nextParam = u.searchParams.get('next');
      if (nextParam) {
        return nextParam;
      }
    } catch (e) {
      console.error('AuthCallback - Error reading return URL:', e);
    }
    return '/register/details';
  }

  useEffect(() => {
    let cancelled = false;
    const client = getSupabase();
    
    async function handleRedirect() {
      if (cancelled) return;
      // Small delay to ensure sessionStorage is fully readable after page load
      await new Promise(r => setTimeout(r, 100));
      const url = getReturnUrl();
      window.location.replace(url);
    }
    
    // Supabase will auto-detect the code in the URL and exchange for a session (PKCE)
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session) {
        handleRedirect();
      }
    });
    // Fallback: after a brief delay, check if session exists; if not, surface an error
    const t = setTimeout(async () => {
      if (cancelled) return;
      try {
        const { data, error: getErr } = await client.auth.getSession();
        if (getErr) throw getErr;
        if (data.session) {
          await handleRedirect();
        } else {
          setError('Authentication did not complete. Please try again.');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown authentication error';
        setError(message);
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0C0E12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CECFD2', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
      <div>
        {error ? (
          <div role="alert">Auth failed: {error}</div>
        ) : (
          <div>Signing you in…</div>
        )}
      </div>
    </div>
  );
}


