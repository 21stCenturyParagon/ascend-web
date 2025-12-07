import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  function getReturnUrl(): string {
    try {
      // 1. Check sessionStorage for stored destination (set by signInWithDiscord)
      const stored = sessionStorage.getItem('auth_return_url');
      if (stored) {
        sessionStorage.removeItem('auth_return_url');
        console.log('AuthCallback - Using stored destination:', stored);
        return stored;
      }
      
      // 2. Check URL query param 'next'
      const u = new URL(window.location.href);
      const nextParam = u.searchParams.get('next');
      if (nextParam) {
        console.log('AuthCallback - Using next param:', nextParam);
        return nextParam;
      }
      
      // 3. Check if redirected from a specific page (referrer)
      if (document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          const referrerPath = referrerUrl.pathname;
          // If coming from a template-related page, preserve it
          if (referrerPath.startsWith('/templates')) {
            console.log('AuthCallback - Using referrer path:', referrerPath);
            return referrerPath;
          }
        } catch {
          // Invalid referrer URL
        }
      }
      
      // 4. Default fallback for registration flow
      console.log('AuthCallback - Using default fallback: /register/details');
      return '/register/details';
    } catch (e) {
      console.error('AuthCallback - Error reading return URL:', e);
      return '/register/details';
    }
  }

  useEffect(() => {
    let cancelled = false;
    const client = getSupabase();
    // Supabase will auto-detect the code in the URL and exchange for a session (PKCE)
    const { data: sub } = client.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      if (session) {
        const url = getReturnUrl();
        console.log('AuthCallback - Redirecting to:', url);
        await new Promise(r => setTimeout(r, 300));
        window.location.replace(url);
      }
    });
    // Fallback: after a brief delay, check if session exists; if not, surface an error
    const t = setTimeout(async () => {
      if (cancelled) return;
      try {
        const { data, error: getErr } = await client.auth.getSession();
        if (getErr) throw getErr;
        if (data.session) {
          const url = getReturnUrl();
          console.log('AuthCallback - Redirecting to (fallback):', url);
          await new Promise(r => setTimeout(r, 300));
          window.location.replace(url);
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


