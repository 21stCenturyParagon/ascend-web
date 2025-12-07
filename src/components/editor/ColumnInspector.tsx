import { useState, useEffect } from 'react';
import type { TableColumn } from '../../lib/templates';
import { loadFont, DEFAULT_FONTS, fetchGoogleFonts } from '../../lib/fonts';

type Props = {
  column: TableColumn;
  onChange: (updated: TableColumn) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export default function ColumnInspector({ column, onChange, onDelete, onDuplicate }: Props) {
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
    void loadFont(column.fontFamily);
  }, [column.fontFamily]);

  const handleFontChange = async (fontFamily: string) => {
    await loadFont(fontFamily);
    onChange({ ...column, fontFamily });
  };

  return (
    <div style={containerStyle}>
      {/* Key Input */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          <span style={labelTextStyle}>CSV Column Key</span>
          <input
            type="text"
            value={column.key}
            onChange={(e) => onChange({ ...column, key: e.target.value })}
            style={inputStyle}
            placeholder="e.g. rank"
          />
        </label>
      </div>

      {/* Layout Group */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Layout</div>
        <div style={gridStyle}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Width</span>
            <input
              type="number"
              value={column.width}
              onChange={(e) => onChange({ ...column, width: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Row Height</span>
            <input
              type="number"
              value={column.rowHeight}
              onChange={(e) => onChange({ ...column, rowHeight: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
        </div>
        <div style={gridStyle}>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Max Rows</span>
            <input
              type="number"
              value={column.maxRows}
              onChange={(e) => onChange({ ...column, maxRows: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Row Gap</span>
            <input
              type="number"
              value={column.rowGap}
              onChange={(e) => onChange({ ...column, rowGap: Number(e.target.value) })}
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
            value={column.fontFamily}
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
              value={column.fontSize}
              onChange={(e) => onChange({ ...column, fontSize: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span style={labelTextStyle}>Weight</span>
            <input
              type="number"
              value={column.fontWeight ?? 400}
              onChange={(e) => onChange({ ...column, fontWeight: Number(e.target.value) })}
              style={inputStyle}
            />
          </label>
        </div>
      </div>

      {/* Appearance Group */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Appearance</div>
        <label style={labelStyle}>
          <span style={labelTextStyle}>Color</span>
          <div style={colorInputWrapperStyle}>
            <input
              type="color"
              value={column.fill}
              onChange={(e) => onChange({ ...column, fill: e.target.value })}
              style={colorInputStyle}
            />
            <span style={colorValueStyle}>{column.fill}</span>
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
              value={column.align}
              onChange={(e) => onChange({ ...column, align: e.target.value as 'left' | 'center' | 'right' })}
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
              value={column.verticalAlign ?? 'middle'}
              onChange={(e) => onChange({ ...column, verticalAlign: e.target.value as 'top' | 'middle' | 'bottom' })}
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
        <button onClick={onDuplicate} style={duplicateButtonStyle}>
          Duplicate
        </button>
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
