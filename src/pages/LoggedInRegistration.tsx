import BrandHeader from '../components/BrandHeader';
import useResponsiveLayout from '../hooks/useResponsiveLayout';
import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';

export default function LoggedInRegistration() {
  const { isTablet, headerMaxWidth } = useResponsiveLayout();
  const cardMaxWidth = Math.min(headerMaxWidth, 505);
  const [email, setEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [riotId, setRiotId] = useState<string>('');
  const [twitter, setTwitter] = useState<string>('');
  const [youtube, setYoutube] = useState<string>('');
  const [agree, setAgree] = useState<boolean>(false);
  const [owns, setOwns] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabase();
    client.auth
      .getUser()
      .then(({ data }) => {
        const u = data?.user as { email?: string | null; user_metadata?: Record<string, unknown> } | null;
        if (u) {
          setEmail(u.email || '');
          const meta = (u.user_metadata || {}) as { full_name?: string; name?: string; avatar_url?: string };
          setDisplayName(meta.full_name || meta.name || '');
          if (typeof meta.avatar_url === 'string' && meta.avatar_url) {
            setAvatarUrl(meta.avatar_url);
          }
        }
      })
      .catch((e) => {
        console.error('Failed to fetch user for registration page:', e);
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!riotId.trim()) { setError('Please enter your Riot ID'); return; }
    if (!agree) { setError('Please agree to the rulebook'); return; }
    try {
      setSubmitting(true);
      // KISS: For now just log. Hook DB later.
      console.log({ email, displayName, riotId, twitter, youtube, owns, agree });
      alert('Submitted!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0C0E12', position: 'relative' }}>
      <BrandHeader isTablet={isTablet} headerMaxWidth={headerMaxWidth} backgroundImageUrl={'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="%230C0E12"/></svg>'} />

      {/* Background gradient strips per Figma
      <div style={{ position: 'absolute', width: 2809, height: 3233.41, left: 'calc(50% - 2809px/2 - 212.7px)', top: -473, transform: 'rotate(-90deg)', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 2808.78, height: 727.08, left: -861.2, top: -472.9, background: 'linear-gradient(0deg, rgba(3, 4, 10, 0) 0%, #000000 64.97%)', transform: 'rotate(-90deg)' }} />
        <div style={{ position: 'absolute', width: 2809, height: 963.91, left: 1408.3, top: -473, background: 'linear-gradient(0deg, rgba(3, 4, 10, 0) 0%, #000000 64.97%)', transform: 'rotate(90deg)' }} />
      </div> */}

      <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 24, paddingRight: 24 }}>
        <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: cardMaxWidth, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0px', gap: 40, background: '#0C0E12', color: '#CECFD2', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
          <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 32, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 16px', gap: 24, width: '100%' }}>
              {/* Header with avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, width: '100%', maxWidth: 473 }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                  <img src={avatarUrl || ''} alt="avatar" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ boxSizing: 'border-box', width: 56, height: 56, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9999, objectFit: 'cover', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ color: '#F7F7F7', fontWeight: 600, fontSize: 20, lineHeight: '30px' }}>Hi {displayName || 'player'}</div>
                    <div style={{ color: '#94979C', fontSize: 16, lineHeight: '24px' }}>{email || 'Register for Ascend Leagues'}</div>
                  </div>
                </div>
              </div>

              {/* Riot ID block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 473 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 20 }}>
                    <div style={{ color: '#CECFD2', fontWeight: 600, fontSize: 14, lineHeight: '20px' }}>Riot ID</div>
                    <div style={{ color: '#94979C', fontWeight: 600, fontSize: 14, lineHeight: '20px' }}>*</div>
                  </div>
                  <div style={{ color: '#94979C', fontSize: 14, lineHeight: '20px' }}>Note that your main account is required for higher approval chance.</div>
                </div>
                <input value={riotId} onChange={(e) => setRiotId(e.target.value)} placeholder="Shroud#NA" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94979C', fontSize: 12 }}>
                  <input type="checkbox" checked={owns} onChange={(e) => setOwns(e.target.checked)} />
                  I confirm that I am the rightful owner of the Riot account submitted above
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 473 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ color: '#F7F7F7', fontWeight: 600, fontSize: 20, lineHeight: '30px' }}>Socials</div>
                  <div style={{ color: '#94979C', fontSize: 14, lineHeight: '20px' }}>Players receive bonus MMR if added and they stream matches.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 473 }}>
                  <div style={{ color: '#94979C', fontSize: 13 }}>X (Formerly Twitter)</div>
                  <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="X Username" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 473 }}>
                  <div style={{ color: '#94979C', fontSize: 13 }}>YouTube</div>
                  <input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="YouTube Channel" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px' }} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 473, color: '#94979C', fontSize: 12 }}>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  I agree to follow and abide by the official <a href="#" style={{ color: '#A78BFA' }}>Ascend Leagues Rulebook</a>
                </label>

                {error && <div role="alert" style={{ color: '#EF4444' }}>{error}</div>}

                <button type="submit" disabled={submitting} style={{ width: '100%', maxWidth: 473, height: 40, background: '#7F56D9', boxShadow: 'inset 0px 0px 0px 1px rgba(12, 14, 18, 0.18), inset 0px -2px 0px rgba(12, 14, 18, 0.05)', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: submitting ? 0.85 : 1 }}>
                  Submit
                </button>
              </div>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}


