import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../lib/supabase';

type ReviewData = {
  id: string;
  riot_id: string;
  twitter: string | null;
  youtube: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_reason: string | null;
};

export default function AdminReview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewData | null>(null);
  const [reason, setReason] = useState('');

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
          // Redirect to login via Discord preserving return url
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
          .select('id, riot_id, twitter, youtube, status, review_reason')
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
      setLoading(true);
      const payload: Partial<ReviewData> = { status };
      if (status === 'approved') {
        (payload as any).approved_at = new Date().toISOString();
      } else {
        (payload as any).review_reason = reason || null;
      }
      const { error: upErr } = await client
        .from('player_registrations')
        .update(payload)
        .eq('id', registrationId);
      if (upErr) throw upErr as unknown as Error;
      setData((d) => (d ? { ...d, status, review_reason: status === 'rejected' ? (reason || null) : d.review_reason } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0C0E12', color: '#CECFD2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 700, border: '1px solid #373A41', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Application Review</h2>
        {loading && <div>Loading…</div>}
        {error && <div role="alert" style={{ color: '#EF4444' }}>{error}</div>}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><strong>Registration ID:</strong> {data.id}</div>
            <div><strong>Riot ID:</strong> {data.riot_id}</div>
            <div><strong>Twitter:</strong> {data.twitter || '—'}</div>
            <div><strong>YouTube:</strong> {data.youtube || '—'}</div>
            <div><strong>Status:</strong> {data.status}</div>
            {data.status !== 'approved' && (
              <>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional rejection reason" rows={3} style={{ width: '100%', background: '#0C0E12', border: '1px solid #373A41', borderRadius: 8, color: '#FFFFFF', padding: '10px 14px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => updateStatus('approved')} disabled={loading} style={{ background: '#10B981', border: 'none', borderRadius: 8, color: '#fff', padding: '10px 16px', cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => updateStatus('rejected')} disabled={loading} style={{ background: '#EF4444', border: 'none', borderRadius: 8, color: '#fff', padding: '10px 16px', cursor: 'pointer' }}>Reject</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


