import React, { useEffect, useRef, useState } from 'react';
import { PacmanLoader, ClipLoader } from 'react-spinners';
// import controllerImage from '../assets/controller.png';
import WebGLGlassHeader from '../components/WebGLGlassHeader';
import BrandHeader from '../components/BrandHeader';
import useResponsiveLayout from '../hooks/useResponsiveLayout';
import { addToWaitlist } from '../lib/supabase';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const { isTablet, isDesktop, isDesktopXL, headerMaxWidth } = useResponsiveLayout();

  // Page loader: wait for fonts/styles, then fade out
  useEffect(() => {
    let cancelled = false;
    async function waitForFontsAndStyles() {
      try {
        const docWithFonts = document as Document & { fonts?: { ready: Promise<void> } };
        const fontsReady: Promise<void> = docWithFonts.fonts?.ready || Promise.resolve();
        // Minimum delay so the spinner is visible and avoids flash
        const minDelay = new Promise((r) => setTimeout(r, 300));
        await Promise.all([fontsReady, minDelay]);
      } catch {
        // Continue even if font readiness API is unavailable
      } finally {
        if (!cancelled) {
          // Fade out overlay
          setOverlayOpacity(0);
          setTimeout(() => {
            if (!cancelled) setPageLoading(false);
          }, 400);
        }
      }
    }
    waitForFontsAndStyles();
    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3000);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      showToast('error', 'Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      showToast('error', 'Please enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      const result = await addToWaitlist(trimmed);
      if (result.success) {
        showToast('success', "You're on the list! We'll notify you when Ascend launches.");
        setEmail('');
      } else {
        showToast('error', result.error || 'Something went wrong');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showToast('error', `Unable to join waitlist. ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundImage: 'url(/resized_1920x1080.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <BrandHeader isTablet={isTablet} headerMaxWidth={headerMaxWidth} backgroundImageUrl={'/resized_1920x1080.png'} />

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingLeft: 24, paddingRight: 24, paddingTop: 0, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#FFFFFF', fontSize: isDesktopXL ? 92 : isDesktop ? 80 : isTablet ? 72 : window.innerWidth > 400 ? 56 : 46, fontWeight: 900, letterSpacing: -3, marginTop: 0, marginBottom: 34, textTransform: 'uppercase', fontFamily: '"Big Shoulders Display", sans-serif' }}>COMING SOON</h1>
          <p style={{ color: '#FFFFFF', fontSize: isDesktopXL ? 22 : isDesktop ? 20 : isTablet ? 18 : window.innerWidth > 400 ? 16 : 15, lineHeight: isDesktopXL ? '30px' : isDesktop ? '28px' : isTablet ? '26px' : window.innerWidth > 400 ? '22px' : '20px', maxWidth: isDesktopXL ? 600 : isDesktop ? 550 : isTablet ? 500 : 400, margin: '0 auto', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
            Ascend is building the infrastructure layer for
            competitive eSports in South Asia powered by data,
            scaled through automation, and built for players.
          </p>
        </div>
      </main>

      <section style={{ display: 'flex', justifyContent: 'center', paddingLeft: isTablet ? 80 : 24, paddingRight: isTablet ? 80 : 24, paddingBottom: isDesktop ? 110 : isTablet ? 96 : 72, position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: isDesktopXL ? 1200 : isDesktop ? 1040 : isTablet ? 860 : 680, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: '#FFFFFF', fontSize: isDesktop ? 22 : isTablet ? 20 : 18, fontWeight: 800, letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase', fontFamily: '"Big Shoulders Display", sans-serif' }}>JOIN THE WAITLIST</div>
          <WebGLGlassHeader
            width={isDesktopXL ? 700 : isDesktop ? 640 : isTablet ? 685 : 500}
            height={isDesktop ? 64 : isTablet ? 72 : 56}
            backgroundImageUrl={'/resized_1920x1080.png'}
          >
          <form onSubmit={onSubmit} style={{ background: 'transparent', borderRadius: 60, display: 'flex', width: '100%', maxWidth: isDesktopXL ? 700 : isDesktop ? 640 : isTablet ? 685 : 500, height: isDesktop ? 64 : isTablet ? 72 : 56, paddingLeft: isDesktop ? 24 : isTablet ? 22 : 16, paddingRight: 4, alignItems: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              disabled={loading}
              style={{ flex: 1, color: '#FFFFFF', fontSize: isDesktop ? 18 : isTablet ? 20 : 16, paddingRight: 10, background: 'transparent', border: 'none', outline: 'none', fontFamily: '"IBM Plex Sans", sans-serif', fontWeight: 400 }}
            />
            <button type="submit" disabled={loading} style={{ backgroundColor: '#532AAB', borderRadius: 60, paddingLeft: isDesktop ? 48 : isTablet ? 56 : 28, paddingRight: isDesktop ? 48 : isTablet ? 56 : 28, height: isDesktop ? 56 : isTablet ? 64 : 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: isDesktop ? 18 : isTablet ? 20 : 16, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: loading ? 0.85 : 1, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
              {loading ? <ClipLoader color="#FFFFFF" size={18} /> : 'Sign up'}
            </button>
          </form>
          </WebGLGlassHeader>
        </div>
        {/* <div style={{ position: 'fixed', left: 0, bottom: 0, width: Math.min(isTablet ? 500 : 340, window.innerWidth * 0.6), height: Math.min(isTablet ? 500 : 340, window.innerWidth * 0.6), zIndex: -1, pointerEvents: 'none' }}>
          <img src={controllerImage} alt="controller" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'left bottom', display: 'block' }} />
        </div> */}
      </section>

      {/* Page loader overlay with fade-out */}
      {pageLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, backgroundColor: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'opacity 400ms ease', opacity: overlayOpacity, pointerEvents: overlayOpacity === 0 ? ('none' as React.CSSProperties['pointerEvents']) : 'auto' }}>
          <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
            <PacmanLoader color="#8B5CF6" loading={true} size={35} speedMultiplier={1} />
            <div style={{ color: '#FFFFFF', fontSize: 16, marginTop: 20, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>Loading</div>
          </div>
        </div>
      )}

      {/* Toast floater (bottom-center) */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)', color: '#FFFFFF', padding: '10px 16px', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 14, letterSpacing: 0.2 }}>
          {toast.text}
        </div>
      )}
    </div>
  );
}


