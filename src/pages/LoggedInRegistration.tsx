import BrandHeader from '../components/BrandHeader';
import useResponsiveLayout from '../hooks/useResponsiveLayout';
import { useEffect, useState } from 'react';
import { getSupabase, checkDiscordServerMembership, savePlayerRegistration } from '../lib/supabase';

function DiscordIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size + 1} height={size} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d="M15.8785 3C15.644 3.41641 15.4334 3.84718 15.242 4.28752C13.4232 4.0147 11.5709 4.0147 9.74729 4.28752C9.56063 3.84718 9.34523 3.41641 9.11072 3C7.402 3.29197 5.73636 3.8041 4.15689 4.52683C1.02664 9.16476 0.179468 13.683 0.600668 18.1391C2.43381 19.4936 4.48715 20.5274 6.67448 21.1879C7.16747 20.5274 7.60303 19.8238 7.97636 19.0915C7.26798 18.8283 6.58354 18.498 5.92782 18.1151C6.10012 17.9907 6.26765 17.8615 6.43038 17.737C10.2738 19.5463 14.7251 19.5463 18.5732 17.737C18.736 17.871 18.9035 18.0003 19.0758 18.1151C18.4201 18.5028 17.7356 18.8283 17.0225 19.0963C17.3958 19.8286 17.8313 20.5322 18.3244 21.1927C20.5116 20.5322 22.5649 19.5032 24.3982 18.1487C24.8959 12.9794 23.5462 8.49945 20.8323 4.53162C19.2577 3.80889 17.592 3.29675 15.8833 3.00957L15.8785 3Z" fill="#5865F2"/>
      <path d="M8.5124 15.3965C7.33019 15.3965 6.349 14.3244 6.349 12.9986C6.349 11.6728 7.29189 10.5958 8.50762 10.5958C9.72335 10.5958 10.6902 11.6775 10.671 12.9986C10.6519 14.3196 9.71856 15.3965 8.5124 15.3965ZM16.4864 15.3965C15.2994 15.3965 14.3278 14.3244 14.3278 12.9986C14.3278 11.6728 15.2707 10.5958 16.4864 10.5958C17.7021 10.5958 18.6642 11.6775 18.645 12.9986C18.6259 14.3196 17.6925 15.3965 16.4864 15.3965Z" fill="white"/>
    </svg>
  );
}

export default function LoggedInRegistration() {
  const { isTablet, headerMaxWidth } = useResponsiveLayout();
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
  const [showDiscordPrompt, setShowDiscordPrompt] = useState<boolean>(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => {
    const client = getSupabase();
    
    async function checkExistingRegistration() {
      try {
        const { data } = await client.auth.getUser();
        const u = data?.user as { email?: string | null; user_metadata?: Record<string, unknown>; id?: string } | null;
        
        if (u) {
          setEmail(u.email || '');
          const meta = (u.user_metadata || {}) as { full_name?: string; name?: string; avatar_url?: string };
          setDisplayName(meta.full_name || meta.name || '');
          if (typeof meta.avatar_url === 'string' && meta.avatar_url) {
            setAvatarUrl(meta.avatar_url);
          }
          
          // Check if user already has a registration
          const { data: existingReg, error: regError } = await client
            .from('player_registrations')
            .select('id')
            .eq('user_id', u.id)
            .single();
          
          if (!regError && existingReg) {
            // User already registered, show success page
            setApplicationSubmitted(true);
          }
        }
      } catch (e) {
        console.error('Failed to fetch user for registration page:', e);
      }
    }
    
    checkExistingRegistration();
  }, []);

  async function checkAndProceed() {
    setError(null);
    setChecking(true);
    try {
      const { isMember, error: checkError } = await checkDiscordServerMembership();
      if (checkError) {
        throw new Error(checkError);
      }
      
      if (!isMember) {
        setShowDiscordPrompt(true);
        return;
      }
      
      // User is in Discord, save to DB
      setShowDiscordPrompt(false); // Hide Discord prompt before saving
      
      const { success, error: saveError } = await savePlayerRegistration({
        riotId,
        twitter: twitter || undefined,
        youtube: youtube || undefined,
        ownsAccount: owns,
      });
      
      if (!success) {
        throw new Error(saveError || 'Failed to save registration');
      }
      
      setApplicationSubmitted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!riotId.trim()) { setError('Please enter your Riot ID'); return; }
    if (!agree) { setError('Please agree to the rulebook'); return; }
    try {
      setSubmitting(true);
      await checkAndProceed();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Show Discord join prompt if user is not in server
  if (showDiscordPrompt) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0C0E12', position: 'relative', overflow: 'hidden' }}>
        <BrandHeader isTablet={isTablet} headerMaxWidth={headerMaxWidth} backgroundImageUrl={'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="%230C0E12"/></svg>'} />
        
        <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, width: '100%', maxWidth: headerMaxWidth, background: 'transparent', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                <div style={{ width: '100%', textAlign: 'center', color: '#F7F7F7', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '32px' }}>Join Ascend Discord to Register</div>
                <div style={{ width: '100%', textAlign: 'center', color: '#94979C', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '24px', maxWidth: 500 }}>In order to participate in Ascend Leagues, you need to be part of the Ascend discord server.</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 473, boxSizing: 'border-box' }}>
              <button
                onClick={() => window.open('https://discord.gg/play-ascend', '_blank')}
                style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: '10px 16px', gap: 12, width: '100%', height: 44, background: '#000000', border: 'none', borderRadius: 8, color: '#FFFFFF', cursor: 'pointer', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 600, fontSize: 16 }}
                aria-label="Join Ascend Discord"
              >
                <DiscordIcon size={24} />
                <span>Join Ascend</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    setChecking(true);
                    await checkAndProceed();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : 'Unknown error';
                    setError(msg);
                  } finally {
                    setChecking(false);
                  }
                }}
                disabled={checking}
                style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: '10px 16px', gap: 12, width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#CECFD2', cursor: 'pointer', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 600, fontSize: 16, opacity: checking ? 0.85 : 1 }}
                aria-label="Recheck Discord membership"
              >
                {checking ? 'Checking...' : 'Recheck'}
              </button>

              {error && <div role="alert" style={{ color: '#EF4444', fontSize: 14, textAlign: 'center', width: '100%' }}>{error}</div>}
              
              <div style={{ marginTop: 12, color: '#94979C', fontSize: 14, lineHeight: '20px', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', textAlign: 'center' }}>
                Facing issues? <a href="mailto:info@play-ascend.com?subject=Discord%20Registration%20Support" style={{ color: '#CECFD2' }}>Contact us</a>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show success page if application submitted
  if (applicationSubmitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0C0E12', position: 'relative', overflow: 'hidden' }}>
        <BrandHeader isTablet={isTablet} headerMaxWidth={headerMaxWidth} backgroundImageUrl={'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="%230C0E12"/></svg>'} />
        
        <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, width: '100%', maxWidth: headerMaxWidth, background: 'transparent', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
              <div style={{ fontSize: 48, marginBottom: 8, color: '#10B981' }}>✓</div>
              <div style={{ width: '100%', textAlign: 'center', color: '#F7F7F7', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 600, fontSize: 24, lineHeight: '32px' }}>Application Submitted!</div>
              <div style={{ width: '100%', textAlign: 'center', color: '#94979C', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 400, fontSize: 16, lineHeight: '24px', maxWidth: 500 }}>
                Your registration is under review. We'll notify you on Discord once your application has been approved.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 473, boxSizing: 'border-box' }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: '10px 16px', width: '100%', height: 44, background: '#7F56D9', boxShadow: 'inset 0px 0px 0px 1px rgba(12, 14, 18, 0.18), inset 0px -2px 0px rgba(12, 14, 18, 0.05)', borderRadius: 8, color: '#FFFFFF', cursor: 'pointer', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 600, fontSize: 16, border: 'none' }}
              >
                Back to Home
              </button>
              
              <div style={{ marginTop: 12, color: '#94979C', fontSize: 14, lineHeight: '20px', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', textAlign: 'center' }}>
                Questions? <a href="mailto:info@play-ascend.com?subject=Application%20Support%20Request" style={{ color: '#CECFD2' }}>Contact us</a>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Default: Show registration form
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0C0E12', position: 'relative', overflow: 'hidden' }}>
      <BrandHeader isTablet={isTablet} headerMaxWidth={headerMaxWidth} backgroundImageUrl={'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="%230C0E12"/></svg>'} />

      {/* Background gradient strips per Figma
      <div style={{ position: 'absolute', width: 2809, height: 3233.41, left: 'calc(50% - 2809px/2 - 212.7px)', top: -473, transform: 'rotate(-90deg)', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 2808.78, height: 727.08, left: -861.2, top: -472.9, background: 'linear-gradient(0deg, rgba(3, 4, 10, 0) 0%, #000000 64.97%)', transform: 'rotate(-90deg)' }} />
        <div style={{ position: 'absolute', width: 2809, height: 963.91, left: 1408.3, top: -473, background: 'linear-gradient(0deg, rgba(3, 4, 10, 0) 0%, #000000 64.97%)', transform: 'rotate(90deg)' }} />
      </div> */}

      <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', width: '100%', boxSizing: 'border-box', overflowX: 'auto' }}>
        <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: headerMaxWidth, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0px', gap: 40, background: 'transparent', color: '#CECFD2', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', boxSizing: 'border-box' }}>
          <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 32, width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 16px', gap: 24, width: '100%', boxSizing: 'border-box' }}>
              {/* Header with avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%', boxSizing: 'border-box' }}>
                  <img src={avatarUrl || ''} alt="avatar" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ boxSizing: 'border-box', width: 56, height: 56, minWidth: 56, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9999, objectFit: 'cover', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ color: '#F7F7F7', fontWeight: 600, fontSize: 20, lineHeight: '30px', wordWrap: 'break-word' }}>Hi {displayName || 'player'}</div>
                    <div style={{ color: '#94979C', fontSize: 16, lineHeight: '24px', wordWrap: 'break-word' }}>{email || 'Register for Ascend Leagues'}</div>
                  </div>
                </div>
              </div>

              {/* Riot ID block */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 20 }}>
                    <div style={{ color: '#CECFD2', fontWeight: 600, fontSize: 14, lineHeight: '20px' }}>Riot ID</div>
                    <div style={{ color: '#94979C', fontWeight: 600, fontSize: 14, lineHeight: '20px' }}>*</div>
                  </div>
                  <div style={{ color: '#94979C', fontSize: 14, lineHeight: '20px' }}>Note that your main account is required for higher approval chance.</div>
                </div>
                <input value={riotId} onChange={(e) => setRiotId(e.target.value)} placeholder="Shroud#NA" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px', boxSizing: 'border-box' }} />
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#94979C', fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={owns} onChange={(e) => setOwns(e.target.checked)} style={{ marginTop: 2, minWidth: 16 }} />
                  <span>I confirm that I am the rightful owner of the Riot account submitted above</span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ color: '#F7F7F7', fontWeight: 600, fontSize: 20, lineHeight: '30px' }}>Socials</div>
                  <div style={{ color: '#94979C', fontSize: 14, lineHeight: '20px' }}>Players receive bonus MMR if added and they stream matches.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ color: '#94979C', fontSize: 13 }}>X (Formerly Twitter)</div>
                  <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="X Username" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ color: '#94979C', fontSize: 13 }}>YouTube</div>
                  <input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="YouTube Channel" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px', boxSizing: 'border-box' }} />
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', color: '#94979C', fontSize: 12, cursor: 'pointer', boxSizing: 'border-box' }}>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2, minWidth: 16 }} />
                  <span>I agree to follow and abide by the official <a href="#" style={{ color: '#A78BFA' }}>Ascend Leagues Rulebook</a></span>
                </label>

                {error && <div role="alert" style={{ color: '#EF4444', width: '100%', boxSizing: 'border-box' }}>{error}</div>}

                <button type="submit" disabled={submitting} style={{ width: '100%', height: 40, background: '#7F56D9', boxShadow: 'inset 0px 0px 0px 1px rgba(12, 14, 18, 0.18), inset 0px -2px 0px rgba(12, 14, 18, 0.05)', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: submitting ? 0.85 : 1, boxSizing: 'border-box' }}>
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


