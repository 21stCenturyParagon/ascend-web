import BrandHeader from '../components/BrandHeader';
import { useEffect } from 'react';
import useResponsiveLayout from '../hooks/useResponsiveLayout';
import { signInWithDiscord } from '../lib/supabase';

function DiscordIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size + 1} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M15.8785 3C15.644 3.41641 15.4334 3.84718 15.242 4.28752C13.4232 4.0147 11.5709 4.0147 9.74729 4.28752C9.56063 3.84718 9.34523 3.41641 9.11072 3C7.402 3.29197 5.73636 3.8041 4.15689 4.52683C1.02664 9.16476 0.179468 13.683 0.600668 18.1391C2.43381 19.4936 4.48715 20.5274 6.67448 21.1879C7.16747 20.5274 7.60303 19.8238 7.97636 19.0915C7.26798 18.8283 6.58354 18.498 5.92782 18.1151C6.10012 17.9907 6.26765 17.8615 6.43038 17.737C10.2738 19.5463 14.7251 19.5463 18.5732 17.737C18.736 17.871 18.9035 18.0003 19.0758 18.1151C18.4201 18.5028 17.7356 18.8283 17.0225 19.0963C17.3958 19.8286 17.8313 20.5322 18.3244 21.1927C20.5116 20.5322 22.5649 19.5032 24.3982 18.1487C24.8959 12.9794 23.5462 8.49945 20.8323 4.53162C19.2577 3.80889 17.592 3.29675 15.8833 3.00957L15.8785 3Z" fill="#5865F2"/>
      <path d="M8.5124 15.3965C7.33019 15.3965 6.349 14.3244 6.349 12.9986C6.349 11.6728 7.29189 10.5958 8.50762 10.5958C9.72335 10.5958 10.6902 11.6775 10.671 12.9986C10.6519 14.3196 9.71856 15.3965 8.5124 15.3965ZM16.4864 15.3965C15.2994 15.3965 14.3278 14.3244 14.3278 12.9986C14.3278 11.6728 15.2707 10.5958 16.4864 10.5958C17.7021 10.5958 18.6642 11.6775 18.645 12.9986C18.6259 14.3196 17.6925 15.3965 16.4864 15.3965Z" fill="white"/>
    </svg>
  );
}

export default function Register() {
  const { isTablet, headerMaxWidth } = useResponsiveLayout();

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const next = url.searchParams.get('next');
      if (next) {
        sessionStorage.setItem('auth_return_url', next);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundImage: 'url(/image.png)', position: 'relative' }}>
      <BrandHeader
        isTablet={isTablet}
        headerMaxWidth={headerMaxWidth}
        backgroundImageUrl={'/image.png'}
      />
      {/* Gradient groups from Figma (rotated strips)
      <div style={{ position: 'absolute', width: 2809, height: 3233.41, left: 'calc(50% - 2809px/2 - 212.7px)', top: -473, transform: 'rotate(-90deg)', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 2808.78, height: 727.08, left: -861.2, top: -472.9, background: 'linear-gradient(0deg, rgba(3, 4, 10, 0) 0%, #000000 64.97%)', transform: 'rotate(-90deg)' }} />
        <div style={{ position: 'absolute', width: 2809, height: 963.91, left: 1408.3, top: -473, background: 'linear-gradient(0deg, rgba(3, 4, 10, 0) 0%, #000000 64.97%)', transform: 'rotate(90deg)' }} />
      </div> */}

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingLeft: 24, paddingRight: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0px', gap: 40, width: '100%', maxWidth: headerMaxWidth, background: 'transparent', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0, gap: 24, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 0, gap: 8, width: '100%' }}>
              <div style={{ width: '100%', height: 32, textAlign: 'center', color: '#F7F7F7', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '32px' }}>Welcome to Ascend Leagues</div>
              <div style={{ width: '100%', height: 24, textAlign: 'center', color: '#94979C', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '24px' }}>Get started with your competitive journey.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 0, gap: 12, width: '100%' }}>
            <button
              onClick={async () => {
                try {
                  await signInWithDiscord('/auth/callback');
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'Unknown error';
                  console.error('Discord OAuth start failed:', msg);
                  alert('Unable to start Discord sign-in. Please try again.');
                }
              }}
              style={{ boxSizing: 'border-box' as const, display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: '10px 16px', gap: 12, width: '100%', height: 44, maxWidth: 473, background: '#0C0E12', border: '1px solid #373A41', boxShadow: 'inset 0px 0px 0px 1px rgba(12, 14, 18, 0.18), inset 0px -2px 0px rgba(12, 14, 18, 0.05)', borderRadius: 8, color: '#CECFD2', cursor: 'pointer', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 600, fontSize: 16 }}
              aria-label="Sign in with Discord"
            >
              <DiscordIcon size={24} />
              <span>Sign in with Discord</span>
            </button>
            <div style={{ marginTop: 4, color: '#94979C', fontSize: 14, lineHeight: '20px', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
              Facing issues? <a href="mailto:support@playascend.gg" style={{ color: '#CECFD2' }}>Contact us</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


