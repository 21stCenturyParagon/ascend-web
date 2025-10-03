import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import BrandHeader from '../components/BrandHeader';
import useResponsiveLayout from '../hooks/useResponsiveLayout';

type ReviewData = {
  id: string;
  riot_id: string;
  twitter: string | null;
  youtube: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_reason: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

export default function AdminReview() {
  const { isTablet, headerMaxWidth } = useResponsiveLayout();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewData | null>(null);
  const [reason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const registrationId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get('id') || '';
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const client = getSupabase();
      try {
        setLoading(true);
        setError(null);
        // Require auth
        const { data: sessionData } = await client.auth.getSession();
        if (!sessionData.session) {
          // Store return URL in sessionStorage for AuthCallback to use
          try {
            sessionStorage.setItem('auth_return_url', window.location.href);
          } catch (e) {
            console.error('Failed to store return URL:', e);
          }
          const ret = encodeURIComponent(window.location.href);
          window.location.replace(`/register?next=${ret}`);
          return;
        }
        // Role check: must be admin
        const { data: roles } = await client.from('user_roles').select('role').eq('user_id', sessionData.session.user.id).maybeSingle();
        if (!roles || roles.role !== 'admin') {
          setError('You do not have permission to review applications.');
          return;
        }
        // Load registration
        const { data: reg, error: regErr } = await client
          .from('player_registrations')
          .select('id, riot_id, twitter, youtube, status, review_reason, approved_at, reviewed_by, display_name, avatar_url')
          .eq('id', registrationId)
          .single();
        if (regErr) throw regErr as unknown as Error;
        if (!cancelled) setData(reg as ReviewData);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [registrationId]);

  async function updateStatus(status: 'approved' | 'rejected') {
    const client = getSupabase();
    try {
      if (!data || data.status !== 'pending') {
        setError('This application has already been processed.');
        return;
      }
      setLoading(true);
      const payload: Partial<ReviewData> = { status };
      if (status === 'approved') {
        (payload as any).approved_at = new Date().toISOString();
      } else {
        (payload as any).review_reason = reason || null;
      }
      const { data: sessionData } = await client.auth.getSession();
      const reviewer = sessionData.session?.user?.id || null;
      (payload as any).reviewed_by = reviewer;
      const { error: upErr } = await client
        .from('player_registrations')
        .update(payload)
        .eq('id', registrationId);
      if (upErr) throw upErr as unknown as Error;
      setData((d) => (d ? { ...d, status, review_reason: status === 'rejected' ? (reason || null) : d.review_reason } as ReviewData : d));
      setShowReject(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundImage: 'url(/image.png)', position: 'relative', overflow: 'hidden' }}>
      <BrandHeader isTablet={isTablet} headerMaxWidth={headerMaxWidth} backgroundImageUrl={'/image.png'} />
      <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', width: '100%', boxSizing: 'border-box' }}>
        <form style={{ width: '100%', maxWidth: headerMaxWidth, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0px', gap: 40, background: 'transparent', color: '#CECFD2', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', boxSizing: 'border-box' }} onSubmit={(e) => e.preventDefault()}>
          <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 32, width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 16px', gap: 24, width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%', boxSizing: 'border-box' }}>
                <img src={data?.avatar_url || ''} alt="avatar" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} style={{ boxSizing: 'border-box', width: 56, height: 56, minWidth: 56, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9999, objectFit: 'cover', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, boxSizing: 'border-box' }}>
                  <div style={{ color: '#F7F7F7', fontWeight: 600, fontSize: 20, lineHeight: '30px', wordWrap: 'break-word', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>Hi {data?.display_name || 'player'}</div>
                  <div style={{ color: '#94979C', fontSize: 16, lineHeight: '24px', wordWrap: 'break-word', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>{'Register for Ascend Leagues'}</div>
                </div>
              </div>
              {loading && <div>Loading…</div>}
              {error && <div role="alert" style={{ color: '#EF4444' }}>{error}</div>}

              {data && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 20 }}>
                        <div style={{ color: '#CECFD2', fontWeight: 600, fontSize: 14, lineHeight: '20px' }}>Riot ID</div>
                      </div>
                    </div>
                    <input value={data.riot_id} readOnly placeholder="Riot ID" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px', boxSizing: 'border-box' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ color: '#94979C', fontSize: 13 }}>X (Formerly Twitter)</div>
                      <input value={data.twitter || ''} readOnly placeholder="X Username" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ color: '#94979C', fontSize: 13 }}>YouTube</div>
                      <input value={data.youtube || ''} readOnly placeholder="YouTube Channel" style={{ width: '100%', height: 44, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ color: '#94979C', fontSize: 14 }}>Status: {data.status}{(data as any).reviewed_by ? ' • Locked' : ''}</div>

                    <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 473 }}>
                      <button onClick={() => updateStatus('approved')} disabled={loading || data.status !== 'pending'} style={{ flex: 1, height: 40, background: '#10B981', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, border: 'none', cursor: data.status === 'pending' ? 'pointer' : 'not-allowed' }}>Approve</button>
                      <button type="button" onClick={() => setShowReject(true)} disabled={loading || data.status !== 'pending'} style={{ flex: 1, height: 40, background: '#EF4444', borderRadius: 8, color: '#FFFFFF', fontWeight: 600, border: 'none', cursor: data.status === 'pending' ? 'pointer' : 'not-allowed' }}>Reject</button>
                    </div>
                  </div>

                  {showReject && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                      <div style={{ width: '100%', maxWidth: 520, background: '#0C0E12', border: '1px solid #373A41', borderRadius: 12, padding: 16 }}>
                        <div style={{ color: '#F7F7F7', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Reject Application</div>
                        <div style={{ color: '#94979C', fontSize: 14, marginBottom: 8 }}>Add an optional reason</div>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Reason (optional)" style={{ width: '100%', background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                          <button type="button" onClick={() => setShowReject(false)} style={{ height: 36, background: 'transparent', border: '1px solid #373A41', borderRadius: 8, color: '#CECFD2', padding: '0 12px', cursor: 'pointer' }}>Cancel</button>
                          <button type="button" onClick={() => updateStatus('rejected')} disabled={loading} style={{ height: 36, background: '#EF4444', border: 'none', borderRadius: 8, color: '#FFFFFF', padding: '0 12px', cursor: 'pointer' }}>Reject</button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}


