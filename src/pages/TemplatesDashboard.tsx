import { useEffect, useState } from 'react';
import TemplateNav from '../components/TemplateNav';
import type { TemplateRecord } from '../lib/templates';
import { listTemplates, getPublicImageUrl } from '../lib/templates';

type Status = { kind: 'loading' | 'error' | 'ready'; message?: string };

export default function TemplatesDashboard() {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);

  useEffect(() => {
    const init = async () => {
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
    void init();
  }, []);

  return (
    <div style={pageStyle}>
      <TemplateNav />
      
      <main style={mainStyle}>
        <div style={headerSection}>
          <h1 style={titleStyle}>Template Gallery</h1>
          <p style={subtitleStyle}>
            Browse community templates or create your own leaderboards, certificates, and more.
          </p>
        </div>

        {status.kind === 'loading' && (
          <div style={loadingStyle}>
            <div style={spinnerStyle} />
            <span>Loading templates...</span>
          </div>
        )}

        {status.kind === 'error' && (
          <div style={errorStyle}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <span>{status.message}</span>
          </div>
        )}

        {status.kind === 'ready' && templates.length === 0 && (
          <div style={emptyStyle}>
            <span style={{ fontSize: 48 }}>📋</span>
            <h3 style={{ margin: '16px 0 8px' }}>No templates yet</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>Be the first to create one!</p>
            <a href="/templates/new" style={createButtonStyle}>
              Create Template
            </a>
          </div>
        )}

        {status.kind === 'ready' && templates.length > 0 && (
          <div style={gridStyle}>
            {templates.map((template) => (
              <article key={template.id} style={cardStyle}>
                <div style={thumbnailContainer}>
                  <img
                    src={getPublicImageUrl(template.background_path)}
                    alt={template.name}
                    style={thumbnailStyle}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%236b7280" font-size="12">No preview</text></svg>';
                    }}
                  />
                </div>
                <div style={cardContent}>
                  <h3 style={cardTitle}>{template.name}</h3>
                  <div style={cardMeta}>
                    <span style={authorStyle}>
                      👤 {template.author_name || 'Anonymous'}
                    </span>
                    <span style={dateStyle}>
                      {new Date(template.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={cardActions}>
                    <a href={`/templates/${template.id}/use`} style={useButtonStyle}>
                      Use Template
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  background: '#f8fafc',
  minHeight: '100vh',
  color: '#0f172a',
};

const mainStyle: React.CSSProperties = {
  maxWidth: '100%',
  margin: '0 auto',
  padding: '24px 16px',
};

const headerSection: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 32,
};

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: '0 0 8px',
  color: '#0f172a',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 16,
  color: '#64748b',
  margin: 0,
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  padding: 48,
  color: '#64748b',
};

const spinnerStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: '3px solid #e5e7eb',
  borderTop: '3px solid #2563eb',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const errorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 16,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  color: '#991b1b',
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 48,
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  textAlign: 'center',
};

const createButtonStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '12px 24px',
  background: '#2563eb',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 8,
  fontWeight: 600,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
  gap: 24,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
  transition: 'box-shadow 0.2s, transform 0.2s',
};

const thumbnailContainer: React.CSSProperties = {
  position: 'relative',
  paddingTop: '56.25%', // 16:9 aspect ratio
  background: '#f1f5f9',
  overflow: 'hidden',
};

const thumbnailStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const cardContent: React.CSSProperties = {
  padding: 16,
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  margin: '0 0 8px',
  color: '#0f172a',
};

const cardMeta: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
  fontSize: 13,
};

const authorStyle: React.CSSProperties = {
  color: '#475569',
};

const dateStyle: React.CSSProperties = {
  color: '#94a3b8',
};

const cardActions: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const useButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  background: '#2563eb',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 6,
  fontWeight: 500,
  textAlign: 'center',
  fontSize: 14,
};
