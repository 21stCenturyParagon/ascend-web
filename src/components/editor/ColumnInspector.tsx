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

  // Load current font on mount
  useEffect(() => {
    loadFont(column.fontFamily);
  }, []);

  const handleFontChange = (fontFamily: string) => {
    loadFont(fontFamily);
    onChange({ ...column, fontFamily });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Column Settings</h3>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Column Key (CSV header)</span>
        <input
          type="text"
          value={column.key}
          onChange={(e) => onChange({ ...column, key: e.target.value })}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Width</span>
          <input
            type="number"
            value={column.width}
            onChange={(e) => onChange({ ...column, width: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Row Height</span>
          <input
            type="number"
            value={column.rowHeight}
            onChange={(e) => onChange({ ...column, rowHeight: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Max Rows</span>
          <input
            type="number"
            value={column.maxRows}
            onChange={(e) => onChange({ ...column, maxRows: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Row Gap</span>
          <input
            type="number"
            value={column.rowGap}
            onChange={(e) => onChange({ ...column, rowGap: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Font Family</span>
        <select
          value={column.fontFamily}
          onChange={(e) => handleFontChange(e.target.value)}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Font Size</span>
          <input
            type="number"
            value={column.fontSize}
            onChange={(e) => onChange({ ...column, fontSize: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Font Weight</span>
          <input
            type="number"
            value={column.fontWeight ?? 400}
            onChange={(e) => onChange({ ...column, fontWeight: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Text Color</span>
        <input
          type="color"
          value={column.fill}
          onChange={(e) => onChange({ ...column, fill: e.target.value })}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb', height: 40 }}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Horizontal Align</span>
          <select
            value={column.align}
            onChange={(e) => onChange({ ...column, align: e.target.value as 'left' | 'center' | 'right' })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Vertical Align</span>
          <select
            value={column.verticalAlign ?? 'middle'}
            onChange={(e) => onChange({ ...column, verticalAlign: e.target.value as 'top' | 'middle' | 'bottom' })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          >
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onDuplicate}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
          }}
        >
          Duplicate
        </button>
        <button
          onClick={onDelete}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
