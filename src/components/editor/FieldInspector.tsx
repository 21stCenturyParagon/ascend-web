import { useState, useEffect } from 'react';
import type { TextField } from '../../lib/templates';
import { loadFont, DEFAULT_FONTS, fetchGoogleFonts } from '../../lib/fonts';

type Props = {
  field: TextField;
  onChange: (updated: TextField) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
};

export default function FieldInspector({ field, onChange, onDelete, onDuplicate }: Props) {
  const [fonts, setFonts] = useState<string[]>(DEFAULT_FONTS);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const fontList = await fetchGoogleFonts();
        setFonts(fontList.slice(0, 100));
      } catch (err) {
        console.warn('Using default font list:', err);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    void loadFont(field.fontFamily);
  }, [field.fontFamily]);

  const handleFontChange = async (fontFamily: string) => {
    await loadFont(fontFamily);
    onChange({ ...field, fontFamily });
  };

  return (
    <div style={containerStyle}>
      {/* Key Input */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          <span style={labelTextStyle}>CSV Column Key</span>
          <input
            type="text"
            value={field.key}
            onChange={(e) => onChange({ ...field, key: e.target.value })}
            style={inputStyle}
            placeholder="e.g. player_name"
          />
        </label>
      </div>

      {/* Size Group */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Size</div>
        <div style={gridStyle}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>W</span>
            <input
              type="number"
              value={field.width}
              onChange={(e) => onChange({ ...field, width: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>H</span>
            <input
              type="number"
              value={field.height}
              onChange={(e) => onChange({ ...field, height: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
        </div>
      </div>

      {/* Typography Group */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Typography</div>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Font</span>
          <select
            value={field.fontFamily}
            onChange={(e) => handleFontChange(e.target.value)}
            style={selectStyle}
          >
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>
        <div style={gridStyle}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Size</span>
            <input
              type="number"
              value={field.fontSize}
              onChange={(e) => onChange({ ...field, fontSize: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Weight</span>
            <input
              type="number"
              value={field.fontWeight ?? 400}
              onChange={(e) => onChange({ ...field, fontWeight: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
        </div>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Line Height</span>
          <input
            type="number"
            step="0.1"
            min={1}
            value={field.lineHeight ?? 1.2}
            onChange={(e) => onChange({ ...field, lineHeight: Math.max(1, Number(e.target.value) || 1.2) })}
            style={inputStyle}
          />
        </label>
      </div>

      {/* Appearance Group */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Appearance</div>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Color</span>
          <div style={colorInputWrapperStyle}>
            <input
              type="color"
              value={field.fill}
              onChange={(e) => onChange({ ...field, fill: e.target.value })}
              style={colorInputStyle}
            />
            <span style={colorValueStyle}>{field.fill}</span>
          </div>
        </label>
      </div>

      {/* Alignment Group */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Alignment</div>
        <div style={gridStyle}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Horizontal</span>
            <select
              value={field.align}
              onChange={(e) => onChange({ ...field, align: e.target.value as 'left' | 'center' | 'right' })}
              style={selectStyle}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Vertical</span>
            <select
              value={field.verticalAlign ?? 'middle'}
              onChange={(e) => onChange({ ...field, verticalAlign: e.target.value as 'top' | 'middle' | 'bottom' })}
              style={selectStyle}
            >
              <option value="top">Top</option>
              <option value="middle">Middle</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div style={actionsStyle}>
        {onDuplicate && (
          <button onClick={onDuplicate} style={duplicateButtonStyle}>
            Duplicate
          </button>
        )}
        <button onClick={onDelete} style={deleteButtonStyle}>
          Delete
        </button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#64748b',
  marginBottom: 4,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const labelTextStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#475569',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  outline: 'none',
  transition: 'border-color 0.15s',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  outline: 'none',
  background: '#fff',
  cursor: 'pointer',
};

const colorInputWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
};

const colorInputStyle: React.CSSProperties = {
  width: 40,
  height: 32,
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};

const colorValueStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: 'monospace',
  color: '#64748b',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 8,
  paddingTop: 16,
  borderTop: '1px solid #e2e8f0',
};

const duplicateButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: '#0f172a',
};

const deleteButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  color: '#991b1b',
};
