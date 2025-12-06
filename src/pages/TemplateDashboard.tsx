import React, { useEffect, useState } from 'react';
import type { TemplateRecord } from '../lib/templates';
import { listTemplates } from '../lib/templates';
import { getSupabase, signInWithDiscord } from '../lib/supabase';

type Status = { kind: 'loading' | 'ready' | 'error' | 'auth'; message?: string };

export default function TemplateDashboard() {
  const [status, setStatus] = useState<Status>({ kind: 'loading', message: 'Loading templates...' });
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSupabase();
        const { data } = await client.auth.getSession();
        if (!data.session) {
          setStatus({ kind: 'auth', message: 'Sign in to view your templates.' });
          return;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to check session.';
        setStatus({ kind: 'error', message });
        return;
      }
      try {
        const res = await listTemplates();
        if (!res.ok) {
          setStatus({ kind: 'error', message: res.error });
          return;
        }
        setTemplates(res.data);
        setStatus({ kind: 'ready' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load templates.';
        setStatus({ kind: 'error', message });
      }
    };
    load();
  }, []);

  if (status.kind === 'auth') {
    return (
      <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Sign in required</h3>
          <p>{status.message}</p>
          <button
            onClick={() => signInWithDiscord('/templates')}
            style={{ background: '#2563eb', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: 6 }}
          >
            Sign in with Discord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh', color: '#0f172a', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Templates</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => (window.location.href = '/templates/new')} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>
            + Create Template
          </button>
        </div>
      </div>

      {status.kind === 'loading' && <div>Loading templates...</div>}
      {status.kind === 'error' && status.message && (
        <div style={{ padding: 10, border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: 6 }}>{status.message}</div>
      )}

      {status.kind === 'ready' && (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {templates.length === 0 && <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>No templates yet. Create one to get started.</div>}
          {templates.map((tpl) => (
            <div key={tpl.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 600 }}>{tpl.name}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                {tpl.width}x{tpl.height} · Updated {new Date(tpl.updated_at).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => (window.location.href = `/templates/${tpl.id}/use`)} style={{ padding: '6px 10px' }}>
                  Use
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


