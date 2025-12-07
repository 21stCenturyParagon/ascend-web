import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CanvasEditor from '../components/editor/CanvasEditor';
import FieldInspector from '../components/editor/FieldInspector';
import RepeatingTableInspector from '../components/editor/RepeatingTableInspector';
import type { TemplateConfig, TemplateElement, TextField, RepeatingTable } from '../lib/templates';
import { createEmptyConfig, buildExampleCsv, uploadTemplateBackground, saveTemplate } from '../lib/templates';
import { getSupabase, signInWithDiscord } from '../lib/supabase';

type Status = { kind: 'idle' | 'success' | 'error' | 'saving'; message?: string };
type AuthState = { kind: 'loading' | 'authed' | 'unauth' | 'error'; message?: string };

const defaultCanvas = createEmptyConfig(800, 600);

function createTextField(): TextField {
  return {
    id: `text-${Date.now()}`,
    type: 'text',
    key: 'field',
    x: 50,
    y: 50,
    width: 200,
    height: 50,
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1.2,
    fill: '#000000',
    align: 'left',
  };
}

function createTable(): RepeatingTable {
  return {
    id: `table-${Date.now()}`,
    type: 'repeating-table',
    groupKey: 'leaderboard',
    x: 50,
    y: 150,
    rowHeight: 48,
    rowGap: 4,
    maxRows: 10,
    columns: [
      { key: 'name', x: 0, width: 200, align: 'left', fontFamily: 'Inter', fontSize: 20, fontWeight: 600, fill: '#000000' },
      { key: 'score', x: 210, width: 120, align: 'right', fontFamily: 'Inter', fontSize: 20, fontWeight: 700, fill: '#000000' },
    ],
  };
}

export default function TemplateBuilder() {
  const [config, setConfig] = useState<TemplateConfig>(defaultCanvas);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState<string>('Leaderboard Template');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [authState, setAuthState] = useState<AuthState>({ kind: 'loading' });

  const stageRef = useRef<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const client = getSupabase();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!data.session) {
          setAuthState({ kind: 'unauth', message: 'Sign in to create templates.' });
          return;
        }
        setAuthState({ kind: 'authed' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to check session.';
        setAuthState({ kind: 'error', message });
      }
    };
    void checkAuth();
  }, []);

  const selectedElement = useMemo(
    () => config.elements.find((el) => el.id === selectedId) ?? null,
    [config.elements, selectedId],
  );

  const setElement = (updated: TemplateElement) => {
    setConfig((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === updated.id ? updated : el)),
    }));
  };

  const deleteElement = () => {
    if (!selectedId) return;
    setConfig((prev) => ({ ...prev, elements: prev.elements.filter((el) => el.id !== selectedId) }));
    setSelectedId(null);
  };

  const handleBackgroundChange = async (file: File) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setConfig((prev) => ({
          ...prev,
          canvas: { width: img.width, height: img.height },
        }));
      };
      img.src = objectUrl;
      setBackgroundFile(file);
      setBackgroundUrl(objectUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load image.';
      setStatus({ kind: 'error', message });
    }
  };

  const handleSave = useCallback(async () => {
    if (!backgroundFile) {
      setStatus({ kind: 'error', message: 'Please upload a background image.' });
      return;
    }
    if (!name.trim()) {
      setStatus({ kind: 'error', message: 'Please provide a template name.' });
      return;
    }
    try {
      setStatus({ kind: 'saving' });
      const upload = await uploadTemplateBackground(backgroundFile);
      if (!upload.ok) {
        setStatus({ kind: 'error', message: upload.error });
        return;
      }
      const save = await saveTemplate({
        name,
        config,
        backgroundPath: upload.data.path,
      });
      if (!save.ok) {
        setStatus({ kind: 'error', message: save.error });
        return;
      }
      setBackgroundUrl(upload.data.publicUrl);
      setStatus({ kind: 'success', message: 'Template saved successfully.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error saving template.';
      setStatus({ kind: 'error', message });
    }
  }, [backgroundFile, config, name]);

  const handleDownloadExampleCsv = () => {
    try {
      const csv = buildExampleCsv(config);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/\s+/g, '_').toLowerCase()}_example.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to download example CSV.';
      setStatus({ kind: 'error', message });
    }
  };

  return (
    <div style={{ padding: 16, display: 'flex', gap: 16, flexDirection: 'column', background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      {authState.kind === 'unauth' && (
        <div
          style={{
            padding: 12,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>Sign in to save templates and upload backgrounds.</div>
          <button
            onClick={() => signInWithDiscord('/templates')}
            style={{ background: '#2563eb', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: 6 }}
          >
            Sign in with Discord
          </button>
        </div>
      )}
      {authState.kind === 'error' && (
        <div style={{ padding: 10, border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: 6 }}>
          {authState.message}
        </div>
      )}
      {authState.kind !== 'authed' ? null : (
      <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          style={{ padding: 8, minWidth: 240 }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleBackgroundChange(file);
          }}
        />
        <button onClick={() => setConfig((prev) => ({ ...prev, elements: [...prev.elements, createTextField()] }))}>
          + Text Field
        </button>
        <button onClick={() => setConfig((prev) => ({ ...prev, elements: [...prev.elements, createTable()] }))}>
          + Repeating Table
        </button>
        <button onClick={handleDownloadExampleCsv}>Download Example CSV</button>
        <button
          onClick={handleSave}
          style={{ background: '#2563eb', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}
          disabled={status.kind === 'saving'}
        >
          {status.kind === 'saving' ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      <div style={{ border: '1px solid #e5e7eb', padding: 10, borderRadius: 8, background: '#f8fafc' }}>
        Text fields read from the first row of your CSV (row 1). Use a Repeating Table for multi-row data like leaderboards.
      </div>

      {status.kind !== 'idle' && (
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ overflow: 'auto' }}>
          <CanvasEditor
            backgroundUrl={backgroundUrl}
            config={config}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdateElement={setElement}
            editable
            stageRef={stageRef}
          />
        </div>
        <div style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, minHeight: 320, background: '#fff' }}>
          {!selectedElement && (
            <div>
              <div>Select an element to edit its properties.</div>
              <p style={{ marginTop: 8, color: '#334155', fontSize: 12 }}>
                Single text fields read from the first CSV row. Repeating tables consume rows 1..maxRows.
              </p>
            </div>
          )}
          {selectedElement?.type === 'text' && (
            <FieldInspector field={selectedElement} onChange={setElement} onDelete={deleteElement} />
          )}
          {selectedElement?.type === 'repeating-table' && (
            <RepeatingTableInspector table={selectedElement} onChange={setElement} onDelete={deleteElement} />
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}


