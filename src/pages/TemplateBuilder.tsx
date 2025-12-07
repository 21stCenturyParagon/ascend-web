import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CanvasEditor from '../components/editor/CanvasEditor';
import FieldInspector from '../components/editor/FieldInspector';
import ColumnInspector from '../components/editor/ColumnInspector';
import type { TemplateConfig, TemplateElement, TextField, TableColumn } from '../lib/templates';
import { createEmptyConfig, buildExampleCsv, uploadTemplateBackground, saveTemplate } from '../lib/templates';
import { getSupabase, signInWithDiscord } from '../lib/supabase';

type Status = { kind: 'idle' | 'success' | 'error' | 'saving'; message?: string };
type AuthState = { kind: 'loading' | 'authed' | 'unauth' | 'error'; message?: string };

const defaultCanvas = createEmptyConfig(800, 600);

function createTextField(): TextField {
  return {
    id: `text-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
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
    verticalAlign: 'middle',
  };
}

function createColumn(): TableColumn {
  return {
    id: `col-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: 'column',
    key: 'col',
    x: 50,
    y: 150,
    width: 150,
    rowHeight: 40,
    rowGap: 4,
    maxRows: 10,
    align: 'left',
    verticalAlign: 'middle',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 400,
    fill: '#000000',
  };
}

export default function TemplateBuilder() {
  const [config, setConfig] = useState<TemplateConfig>(defaultCanvas);
  const [history, setHistory] = useState<TemplateConfig[]>([defaultCanvas]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
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

  const pushHistory = (newConfig: TemplateConfig) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newConfig);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setConfig(newConfig);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setConfig(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setConfig(history[newIndex]);
    }
  };

  const setElement = (updated: TemplateElement) => {
    const newConfig = {
      ...config,
      elements: config.elements.map((el) => (el.id === updated.id ? updated : el)),
    };
    pushHistory(newConfig);
  };

  const deleteElement = () => {
    if (!selectedId) return;
    const newConfig = { ...config, elements: config.elements.filter((el) => el.id !== selectedId) };
    pushHistory(newConfig);
    setSelectedId(null);
  };

  const duplicateElement = () => {
    if (!selectedElement) return;
    const duplicated = {
      ...selectedElement,
      id: `${selectedElement.type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
    };
    const newConfig = { ...config, elements: [...config.elements, duplicated] };
    pushHistory(newConfig);
    setSelectedId(duplicated.id);
  };

  const handleBackgroundChange = async (file: File) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const newConfig = {
          ...config,
          canvas: { width: img.width, height: img.height },
        };
        pushHistory(newConfig);
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

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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
        <button onClick={() => pushHistory({ ...config, elements: [...config.elements, createTextField()] })}>
          + Text Field
        </button>
        <button onClick={() => pushHistory({ ...config, elements: [...config.elements, createColumn()] })}>
          + Column
        </button>
        <button onClick={handleDownloadExampleCsv}>Download Example CSV</button>
        <button
          onClick={undo}
          disabled={!canUndo}
          style={{ background: canUndo ? '#6b7280' : '#d1d5db', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          style={{ background: canRedo ? '#6b7280' : '#d1d5db', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}
        >
          Redo
        </button>
        <button
          onClick={handleSave}
          style={{ background: '#2563eb', color: '#fff', padding: '8px 12px', borderRadius: 6, border: 'none' }}
          disabled={status.kind === 'saving'}
        >
          {status.kind === 'saving' ? 'Saving...' : 'Save Template'}
        </button>
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
        <div style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, minHeight: 320 }}>
          {!selectedElement && <div>Select an element to edit its properties.</div>}
          {selectedElement?.type === 'text' && (
            <FieldInspector field={selectedElement} onChange={setElement} onDelete={deleteElement} onDuplicate={duplicateElement} />
          )}
          {selectedElement?.type === 'column' && (
            <ColumnInspector column={selectedElement} onChange={setElement} onDelete={deleteElement} onDuplicate={duplicateElement} />
          )}
        </div>
      </div>
    </div>
  );
}
