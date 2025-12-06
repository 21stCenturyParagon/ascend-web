import React, { useEffect, useState } from 'react';
import { listTemplates } from '../lib/templates';
import { getSupabase, signInWithDiscord } from '../lib/supabase';

type Status = { kind: 'loading' | 'error' | 'ready' | 'auth'; message?: string };

export default function TemplatesDashboard() {
  const [status, setStatus] = useState<Status>({ kind: 'loading', message: 'Checking session...' });
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const client = getSupabase();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          setStatus({ kind: 'auth', message: 'Please sign in to manage templates.' });
          return;
        }
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
    void init();
  }, []);

  if (status.kind === 'auth') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h2>Sign in required</h2>
          <p>{status.message}</p>
          <button onClick={() => signInWithDiscord()} style={primaryButton}>
            Sign in with Discord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerRow}>
        <h2 style={{ margin: 0 }}>Templates</h2>
        <button
          style={primaryButton}
          onClick={() => {
            window.location.href = '/templates/new';
          }}
        >
          + New Template
        </button>
      </div>

      {status.kind === 'loading' && <div style={cardStyle}>Loading templates...</div>}
      {status.kind === 'error' && <div style={{ ...cardStyle, borderColor: '#ef4444', color: '#991b1b' }}>{status.message}</div>}
      {status.kind === 'ready' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {templates.length === 0 && <div style={cardStyle}>No templates yet. Create one to get started.</div>}
          {templates.map((t) => (
            <div key={t.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{t.id}</div>
                </div>
                <button
                  style={secondaryButton}
                  onClick={() => {
                    window.location.href = `/templates/${t.id}/use`;
                  }}
                >
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

const pageStyle: React.CSSProperties = {
  padding: 16,
  background: '#f8fafc',
  minHeight: '100vh',
  color: '#0f172a',
};

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 12,
  background: '#fff',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
};

const primaryButton: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '8px 12px',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const secondaryButton: React.CSSProperties = {
  background: '#fff',
  color: '#2563eb',
  padding: '6px 10px',
  border: '1px solid #2563eb',
  borderRadius: 6,
  cursor: 'pointer',
};


