import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TemplateNav from '../components/TemplateNav';
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
  const [zoom, setZoom] = useState<number>(1);

  const stageRef = useRef<any>(null);

  const zoomIn = () => setZoom((z) => Math.min(z * 1.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.25));
  const zoomReset = () => setZoom(1);
  const zoomPercent = Math.round(zoom * 100);

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

  // Get all existing keys except the one being edited
  const getExistingKeys = (excludeId?: string) => {
    return new Set(config.elements.filter((el) => el.id !== excludeId).map((el) => el.key));
  };

  // Generate a unique key by appending a number suffix
  const generateUniqueKey = (baseKey: string, excludeId?: string): string => {
    const existingKeys = getExistingKeys(excludeId);
    if (!existingKeys.has(baseKey)) return baseKey;
    
    let counter = 2;
    let newKey = `${baseKey}_${counter}`;
    while (existingKeys.has(newKey)) {
      counter++;
      newKey = `${baseKey}_${counter}`;
    }
    return newKey;
  };

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
    // Check for duplicate keys (excluding the element being updated)
    const existingKeys = getExistingKeys(updated.id);
    if (existingKeys.has(updated.key)) {
      setStatus({ kind: 'error', message: `Key "${updated.key}" is already used by another element. Please use a unique key.` });
      return;
    }
    
    const newConfig = {
      ...config,
      elements: config.elements.map((el) => (el.id === updated.id ? updated : el)),
    };
    pushHistory(newConfig);
    // Clear error if there was one
    if (status.kind === 'error' && status.message?.includes('already used')) {
      setStatus({ kind: 'idle' });
    }
  };

  const deleteElement = () => {
    if (!selectedId) return;
    const newConfig = { ...config, elements: config.elements.filter((el) => el.id !== selectedId) };
    pushHistory(newConfig);
    setSelectedId(null);
  };

  const duplicateElement = () => {
    if (!selectedElement) return;
    const newId = `${selectedElement.type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const newKey = generateUniqueKey(selectedElement.key);
    const duplicated = {
      ...selectedElement,
      id: newId,
      key: newKey,
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
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      <TemplateNav />
      
      <main style={{ padding: 16, maxWidth: 2000, margin: '0 auto' }}>
        {/* Auth warning banner */}
        {authState.kind === 'unauth' && (
          <div style={authBannerStyle}>
            <span>⚠️ Sign in to save templates and upload backgrounds.</span>
            <button
              onClick={() => signInWithDiscord('/templates/new')}
              style={signInBtnStyle}
            >
              Sign in with Discord
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div style={toolbarStyle}>
          <div style={toolbarLeft}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              style={nameInputStyle}
            />
            <label style={fileInputLabel}>
              📷 Upload Background
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBackgroundChange(file);
                }}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          <div style={toolbarCenter}>
            <button onClick={() => {
              const newField = createTextField();
              newField.key = generateUniqueKey(newField.key);
              pushHistory({ ...config, elements: [...config.elements, newField] });
            }} style={addBtnStyle}>
              + Text
            </button>
            <button onClick={() => {
              const newCol = createColumn();
              newCol.key = generateUniqueKey(newCol.key);
              pushHistory({ ...config, elements: [...config.elements, newCol] });
            }} style={addBtnStyle}>
              + Column
            </button>
            <div style={dividerStyle} />
            <button onClick={undo} disabled={!canUndo} style={iconBtnStyle} title="Undo">
              ↩️
            </button>
            <button onClick={redo} disabled={!canRedo} style={iconBtnStyle} title="Redo">
              ↪️
            </button>
            <div style={dividerStyle} />
            <button onClick={zoomOut} style={iconBtnStyle} title="Zoom Out">
              ➖
            </button>
            <span style={zoomLabelStyle} onClick={zoomReset} title="Click to reset zoom">
              {zoomPercent}%
            </span>
            <button onClick={zoomIn} style={iconBtnStyle} title="Zoom In">
              ➕
            </button>
          </div>

          <div style={toolbarRight}>
            <button onClick={handleDownloadExampleCsv} style={secondaryBtnStyle}>
              📄 Example CSV
            </button>
            <button
              onClick={handleSave}
              style={saveBtnStyle}
              disabled={status.kind === 'saving' || authState.kind !== 'authed'}
            >
              {status.kind === 'saving' ? 'Saving...' : '💾 Save Template'}
            </button>
          </div>
        </div>

        {/* Status message */}
        {status.kind !== 'idle' && (
          <div style={{
            ...statusStyle,
            borderColor: status.kind === 'error' ? '#ef4444' : '#10b981',
            color: status.kind === 'error' ? '#991b1b' : '#065f46',
            background: status.kind === 'error' ? '#fef2f2' : '#ecfdf3',
          }}>
            {status.kind === 'error' ? '❌' : '✅'} {status.message}
          </div>
        )}

        {/* Main editor area */}
        <div style={editorLayoutStyle}>
          <div style={canvasContainerStyle}>
            <CanvasEditor
              backgroundUrl={backgroundUrl}
              config={config}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdateElement={setElement}
              editable
              stageRef={stageRef}
              scale={zoom}
              onScaleChange={setZoom}
            />
            <div style={zoomHintStyle}>
              Use mouse wheel to zoom • Click percentage to reset
            </div>
          </div>
          
          <div style={inspectorPanelStyle}>
            <h3 style={inspectorTitleStyle}>Properties</h3>
            {!selectedElement && (
              <div style={emptyInspectorStyle}>
                <span style={{ fontSize: 32 }}>👆</span>
                <p>Select an element on the canvas to edit its properties</p>
              </div>
            )}
            {selectedElement?.type === 'text' && (
              <FieldInspector 
                field={selectedElement} 
                onChange={setElement} 
                onDelete={deleteElement} 
                onDuplicate={duplicateElement} 
              />
            )}
            {selectedElement?.type === 'column' && (
              <ColumnInspector 
                column={selectedElement} 
                onChange={setElement} 
                onDelete={deleteElement} 
                onDuplicate={duplicateElement} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Styles
const authBannerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  background: '#fffbeb',
  border: '1px solid #fbbf24',
  borderRadius: 8,
  marginBottom: 16,
};

const signInBtnStyle: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '8px 16px',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 500,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  marginBottom: 16,
  gap: 16,
  flexWrap: 'wrap',
};

const toolbarLeft: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const toolbarCenter: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const toolbarRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const nameInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 14,
  minWidth: 200,
};

const fileInputLabel: React.CSSProperties = {
  padding: '8px 12px',
  background: '#f1f5f9',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
};

const addBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: '#f1f5f9',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
};

const iconBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 16,
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 24,
  background: '#e5e7eb',
  margin: '0 4px',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
};

const saveBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
};

const statusStyle: React.CSSProperties = {
  padding: '10px 14px',
  border: '1px solid',
  borderRadius: 6,
  marginBottom: 16,
  fontSize: 14,
};

const editorLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 320px',
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

const inspectorPanelStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: 16,
  minHeight: 400,
  maxHeight: 'calc(100vh - 200px)',
  overflow: 'auto',
  position: 'sticky',
  top: 80,
};

const inspectorTitleStyle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 16,
  fontWeight: 600,
  paddingBottom: 12,
  borderBottom: '1px solid #e5e7eb',
};

const emptyInspectorStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#6b7280',
  padding: '32px 16px',
};

const zoomLabelStyle: React.CSSProperties = {
  padding: '4px 8px',
  background: '#f1f5f9',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
  minWidth: 45,
  textAlign: 'center',
  cursor: 'pointer',
  userSelect: 'none',
};

const zoomHintStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: '#94a3b8',
  textAlign: 'center',
};
