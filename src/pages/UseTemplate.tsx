import { useEffect, useMemo, useRef, useState } from 'react';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import TemplateNav from '../components/TemplateNav';
import CanvasEditor from '../components/editor/CanvasEditor';
import type { TemplateConfig, TemplateRecord } from '../lib/templates';
import { getPublicImageUrl, getTemplateById, mapCsvToTemplateData, buildExampleCsv } from '../lib/templates';
import { deriveMaxRows, extractTableRows, parseCsvFile, validateCsvHeaders } from '../lib/csv';
import { getSupabase, signInWithDiscord } from '../lib/supabase';

type Status = { kind: 'idle' | 'loading' | 'error' | 'ready'; message?: string };

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
  const stageRef = useRef<KonvaStage | null>(null);

  const maxRows = useMemo(() => (config ? deriveMaxRows(config) : 0), [config]);
  const isOverLimit = maxRows > 0 && rows.length > maxRows;
  const trimmedRows = useMemo(() => (isOverLimit ? rows.slice(0, maxRows) : rows), [rows, isOverLimit, maxRows]);

  useEffect(() => {
    const load = async () => {
      try {
        // Check authentication first
        const client = getSupabase();
        const { data: sessionData } = await client.auth.getSession();
        
        if (!sessionData.session) {
          // Not authenticated - redirect to sign in
          const currentPath = window.location.pathname;
          await signInWithDiscord(currentPath);
          return;
        }
        
        const id = getTemplateIdFromPath();
        if (!id) {
          setStatus({ kind: 'error', message: 'Template ID not found in URL.' });
          return;
        }
        
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
      setStatus({ 
        kind: 'ready', 
        message: overLimit.length 
          ? `CSV loaded with ${parsed.data.rows.length} rows. Remove ${overLimit.length} to fit the template.` 
          : `CSV loaded successfully with ${parsed.data.rows.length} rows.` 
      });
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

  const handleDownloadExampleCsv = () => {
    if (!config || !template) return;
    try {
      const csv = buildExampleCsv(config);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name.replace(/\s+/g, '_').toLowerCase()}_example.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setStatus({ kind: 'error', message: 'Unable to generate example CSV.' });
    }
  };

  const handleDownloadImage = async () => {
    try {
      const stage = stageRef.current;
      if (!stage) {
        setStatus({ kind: 'error', message: 'Canvas not ready. Please wait for the template to fully load.' });
        return;
      }

      if (typeof stage.toBlob !== 'function' && typeof stage.toDataURL !== 'function') {
        setStatus({ kind: 'error', message: 'Unable to access canvas. Please refresh and try again.' });
        return;
      }

      const filename = `${template?.name?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'filled_template'}.png`;

      // Try using toBlob first
      if (typeof stage.toBlob === 'function') {
        const blob = await new Promise<Blob | null>((resolve) => {
          stage.toBlob({
            pixelRatio: 2,
            mimeType: 'image/png',
            callback: (blob: Blob | null) => resolve(blob),
          });
        });

        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          setStatus({ kind: 'ready', message: 'Image downloaded successfully!' });
          return;
        }
      }

      // Fallback to toDataURL
      const dataUrl = stage.toDataURL({ pixelRatio: 2 });
      
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        setStatus({ kind: 'error', message: 'Failed to generate image. Please try again.' });
        return;
      }

      const parts = dataUrl.split(',');
      if (parts.length !== 2) {
        setStatus({ kind: 'error', message: 'Invalid image data generated.' });
        return;
      }
      
      const byteString = atob(parts[1]);
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = filename;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      setStatus({ kind: 'ready', message: 'Image downloaded successfully!' });
    } catch (err) {
      console.error('Download error:', err);
      const message = err instanceof Error ? err.message : 'Unable to download image.';
      if (message.includes('tainted') || message.includes('cross-origin') || message.includes('SecurityError')) {
        setStatus({ kind: 'error', message: 'Cannot export image due to cross-origin restrictions.' });
      } else {
        setStatus({ kind: 'error', message: `Download failed: ${message}` });
      }
    }
  };

  return (
    <div style={pageStyle}>
      <TemplateNav />
      
      <main style={mainStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <a href="/templates" style={backLinkStyle}>← Back to Templates</a>
            <h1 style={titleStyle}>{template?.name || 'Loading...'}</h1>
            {template?.author_name && (
              <p style={authorStyle}>by {template.author_name}</p>
            )}
          </div>
        </div>

        {/* Loading state */}
        {status.kind === 'loading' && (
          <div style={loadingStyle}>
            <div style={spinnerStyle} />
            <span>{status.message}</span>
          </div>
        )}

        {/* Error state */}
        {status.kind === 'error' && (
          <div style={errorStyle}>
            ❌ {status.message}
          </div>
        )}

        {/* Success message */}
        {status.kind === 'ready' && status.message && (
          <div style={successStyle}>
            ✅ {status.message}
          </div>
        )}

        {/* Main content */}
        {config && (
          <>
            {/* Toolbar */}
            <div style={toolbarStyle}>
              <div style={toolbarLeft}>
                <label style={uploadLabelStyle}>
                  📄 Upload CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvUpload(file);
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                <button onClick={handleDownloadExampleCsv} style={secondaryBtnStyle}>
                  📋 Example CSV
                </button>
              </div>
              <button 
                onClick={handleDownloadImage} 
                disabled={!renderData && rows.length === 0}
                style={downloadBtnStyle}
              >
                ⬇️ Download PNG
              </button>
            </div>

            {/* Over limit warning */}
            {isOverLimit && (
              <div style={warningStyle}>
                ⚠️ CSV has {rows.length} rows but template supports {maxRows}. 
                Remove {rows.length - maxRows} row(s) below or they will be truncated.
              </div>
            )}

            {/* Editor layout */}
            <div style={editorLayoutStyle}>
              <div style={canvasContainerStyle}>
                <CanvasEditor
                  backgroundUrl={backgroundUrl}
                  config={config}
                  data={renderData ?? undefined}
                  editable={false}
                  stageRef={stageRef}
                />
              </div>
              
              <div style={sidebarStyle}>
                <h3 style={sidebarTitleStyle}>
                  CSV Data {rows.length > 0 && `(${rows.length} rows)`}
                </h3>
                
                {rows.length === 0 && (
                  <div style={emptyDataStyle}>
                    <span style={{ fontSize: 32 }}>📄</span>
                    <p>Upload a CSV file to fill in the template</p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>
                      Text fields use row 1 • Columns use multiple rows
                    </p>
                  </div>
                )}

                {rows.length > 0 && (
                  <div style={rowsListStyle}>
                    {rows.map((row, idx) => (
                      <div
                        key={`row-${idx}`}
                        style={{
                          ...rowCardStyle,
                          opacity: idx >= maxRows ? 0.6 : 1,
                          borderColor: idx >= maxRows ? '#fbbf24' : '#e5e7eb',
                        }}
                      >
                        <div style={rowHeaderStyle}>
                          <span style={rowNumStyle}>Row {idx + 1}</span>
                          {idx >= maxRows && (
                            <span style={overLimitBadgeStyle}>Over limit</span>
                          )}
                        </div>
                        <div style={rowDataStyle}>
                          {headers.slice(0, 3).map((h) => (
                            <div key={h} style={rowFieldStyle}>
                              <span style={fieldLabelStyle}>{h}</span>
                              <span style={fieldValueStyle}>{row[h] || '—'}</span>
                            </div>
                          ))}
                          {headers.length > 3 && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              +{headers.length - 3} more fields
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => handleRemoveRow(idx)} 
                          style={removeRowBtnStyle}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Styles
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

const headerStyle: React.CSSProperties = {
  marginBottom: 24,
};

const backLinkStyle: React.CSSProperties = {
  color: '#6b7280',
  textDecoration: 'none',
  fontSize: 14,
  display: 'inline-block',
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  margin: '0 0 4px',
};

const authorStyle: React.CSSProperties = {
  color: '#6b7280',
  margin: 0,
  fontSize: 14,
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
  padding: '12px 16px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 8,
  color: '#991b1b',
  marginBottom: 16,
};

const successStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: 8,
  color: '#065f46',
  marginBottom: 16,
};

const warningStyle: React.CSSProperties = {
  padding: '12px 16px',
  background: '#fffbeb',
  border: '1px solid #fbbf24',
  borderRadius: 8,
  color: '#92400e',
  marginBottom: 16,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  marginBottom: 16,
};

const toolbarLeft: React.CSSProperties = {
  display: 'flex',
  gap: 8,
};

const uploadLabelStyle: React.CSSProperties = {
  padding: '10px 16px',
  background: '#2563eb',
  color: '#fff',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 16px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
};

const downloadBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#10b981',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
};

const editorLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 340px',
  gap: 16,
  alignItems: 'flex-start',
};

const canvasContainerStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  overflow: 'auto',
};

const sidebarStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
};

const sidebarTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 16,
  fontWeight: 600,
};

const emptyDataStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '32px 16px',
  color: '#6b7280',
};

const rowsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxHeight: 500,
  overflow: 'auto',
};

const rowCardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  padding: 10,
  background: '#fafafa',
};

const rowHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const rowNumStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 13,
};

const overLimitBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  background: '#fef3c7',
  color: '#92400e',
  padding: '2px 6px',
  borderRadius: 4,
};

const rowDataStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginBottom: 8,
};

const rowFieldStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 12,
};

const fieldLabelStyle: React.CSSProperties = {
  color: '#6b7280',
};

const fieldValueStyle: React.CSSProperties = {
  fontWeight: 500,
  maxWidth: 150,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const removeRowBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 12,
  color: '#6b7280',
};
