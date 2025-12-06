import React, { useEffect, useMemo, useRef, useState } from 'react';
import CanvasEditor from '../components/editor/CanvasEditor';
import type { TemplateConfig, TemplateRecord } from '../lib/templates';
import { getPublicImageUrl, getTemplateById, mapCsvToTemplateData } from '../lib/templates';
import { deriveMaxRows, extractTableRows, parseCsvFile, validateCsvHeaders } from '../lib/csv';
import { getSupabase, signInWithDiscord } from '../lib/supabase';

type Status = { kind: 'idle' | 'loading' | 'error' | 'ready' | 'auth'; message?: string };

function getTemplateIdFromPath(): string | null {
  try {
    const match = window.location.pathname.match(/\/templates\/([^/]+)\/use/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export default function UseTemplate() {
  const [status, setStatus] = useState<Status>({ kind: 'loading', message: 'Loading template...' });
  const [template, setTemplate] = useState<TemplateRecord | null>(null);
  const [config, setConfig] = useState<TemplateConfig | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const stageRef = useRef<any>(null);

  const maxRows = useMemo(() => (config ? deriveMaxRows(config) : 0), [config]);
  const isOverLimit = maxRows > 0 && rows.length > maxRows;
  const trimmedRows = useMemo(() => (isOverLimit ? rows.slice(0, maxRows) : rows), [rows, isOverLimit, maxRows]);

  useEffect(() => {
    const load = async () => {
      try {
        const client = getSupabase();
        const { data } = await client.auth.getSession();
        if (!data.session) {
          setStatus({ kind: 'auth', message: 'Sign in to use templates.' });
          return;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to check session.';
        setStatus({ kind: 'error', message });
        return;
      }
      const id = getTemplateIdFromPath();
      if (!id) {
        setStatus({ kind: 'error', message: 'Template id not found in URL.' });
        return;
      }
      try {
        const res = await getTemplateById(id);
        if (!res.ok) {
          setStatus({ kind: 'error', message: res.error });
          return;
        }
        setTemplate(res.data);
        setConfig(res.data.config);
        setBackgroundUrl(getPublicImageUrl(res.data.background_path));
        setStatus({ kind: 'ready' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load template.';
        setStatus({ kind: 'error', message });
      }
    };
    load();
  }, []);

  const handleCsvUpload = async (file: File) => {
    if (!config) {
      setStatus({ kind: 'error', message: 'Template not loaded yet.' });
      return;
    }
    try {
      const parsed = await parseCsvFile(file);
      if (!parsed.ok) {
        setStatus({ kind: 'error', message: parsed.error });
        return;
      }
      const validation = validateCsvHeaders(parsed.data.headers, config);
      if (!validation.ok) {
        setStatus({ kind: 'error', message: validation.error });
        return;
      }
      const { withinLimit, overLimit } = extractTableRows(parsed.data.rows, maxRows || parsed.data.rows.length);
      setHeaders(parsed.data.headers);
      setRows([...withinLimit, ...overLimit]);
      setStatus({ kind: 'ready', message: overLimit.length ? 'CSV has more rows than allowed. Please remove extras below.' : 'CSV loaded.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to process CSV.';
      setStatus({ kind: 'error', message });
    }
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const renderData = useMemo(() => {
    if (!config) return null;
    return mapCsvToTemplateData(config, trimmedRows);
  }, [config, trimmedRows]);

  const handleDownloadImage = async () => {
    try {
      const stage = stageRef.current;
      if (!stage) {
        setStatus({ kind: 'error', message: 'Nothing to download yet.' });
        return;
      }
      const uri: string = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.href = uri;
      link.download = `${template?.name || 'filled-template'}.png`;
      link.click();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to download image.';
      setStatus({ kind: 'error', message });
    }
  };

  if (status.kind === 'auth') {
    return (
      <div style={{ padding: 16, background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Sign in required</h3>
          <p>{status.message}</p>
          <button onClick={() => signInWithDiscord(window.location.pathname)} style={{ background: '#2563eb', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: 6 }}>
            Sign in with Discord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>{template?.name || 'Use Template'}</h2>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleCsvUpload(file);
          }}
        />
        <button onClick={handleDownloadImage} disabled={!renderData}>
          Download PNG
        </button>
      </div>

      {status.kind !== 'idle' && status.kind !== 'auth' && status.message && (
        <div
          style={{
            padding: 10,
            border: '1px solid',
            borderColor: status.kind === 'error' ? '#ef4444' : '#10b981',
            color: status.kind === 'error' ? '#991b1b' : '#065f46',
            background: status.kind === 'error' ? '#fef2f2' : '#ecfdf3',
            borderRadius: 6,
          }}
        >
          {status.message}
        </div>
      )}

      {isOverLimit && (
        <div style={{ border: '1px solid #fbbf24', background: '#fffbeb', padding: 10, borderRadius: 6 }}>
          CSV has {rows.length} rows. The template allows {maxRows}. Please remove {rows.length - maxRows} row(s) below.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ overflow: 'auto' }}>
          {config && (
            <CanvasEditor
              backgroundUrl={backgroundUrl}
              config={config}
              data={renderData ?? undefined}
              editable={false}
              stageRef={stageRef}
            />
          )}
        </div>
        <div style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>CSV Rows ({rows.length})</h3>
          {headers.length === 0 && <div>Upload a CSV to see rows. Single text fields use row 1 values; tables use rows up to maxRows.</div>}
          {headers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflow: 'auto' }}>
              {rows.map((row, idx) => (
                <div
                  key={`row-${idx}`}
                  style={{
                    border: '1px solid #e5e7eb',
                    padding: 8,
                    borderRadius: 6,
                    background: idx < maxRows ? '#f8fafc' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
                    {headers.slice(0, 4).map((h) => (
                      <span key={h}>
                        <strong>{h}:</strong> {row[h]}
                      </span>
                    ))}
                    {headers.length > 4 && <span>+{headers.length - 4} more...</span>}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                    <button onClick={() => handleRemoveRow(idx)} style={{ padding: '4px 8px' }}>
                      Remove row
                    </button>
                    {idx >= maxRows && <span style={{ color: '#b45309' }}>Over limit</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


