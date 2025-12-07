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

  // Load current font on mount
  useEffect(() => {
    loadFont(field.fontFamily);
  }, []);

  const handleFontChange = (fontFamily: string) => {
    loadFont(fontFamily);
    onChange({ ...field, fontFamily });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Text Field Settings</h3>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Field Key (CSV header)</span>
        <input
          type="text"
          value={field.key}
          onChange={(e) => onChange({ ...field, key: e.target.value })}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Width</span>
          <input
            type="number"
            value={field.width}
            onChange={(e) => onChange({ ...field, width: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Height</span>
          <input
            type="number"
            value={field.height}
            onChange={(e) => onChange({ ...field, height: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Font Family</span>
        <select
          value={field.fontFamily}
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
            value={field.fontSize}
            onChange={(e) => onChange({ ...field, fontSize: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Font Weight</span>
          <input
            type="number"
            value={field.fontWeight ?? 400}
            onChange={(e) => onChange({ ...field, fontWeight: Number(e.target.value) })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          />
        </label>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Line Height</span>
        <input
          type="number"
          step="0.1"
          min={1}
          value={field.lineHeight ?? 1.2}
          onChange={(e) => onChange({ ...field, lineHeight: Math.max(1, Number(e.target.value) || 1.2) })}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Text Color</span>
        <input
          type="color"
          value={field.fill}
          onChange={(e) => onChange({ ...field, fill: e.target.value })}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb', height: 40 }}
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Horizontal Align</span>
          <select
            value={field.align}
            onChange={(e) => onChange({ ...field, align: e.target.value as 'left' | 'center' | 'right' })}
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
            value={field.verticalAlign ?? 'middle'}
            onChange={(e) => onChange({ ...field, verticalAlign: e.target.value as 'top' | 'middle' | 'bottom' })}
            style={{ padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }}
          >
            <option value="top">Top</option>
            <option value="middle">Middle</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {onDuplicate && (
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
        )}
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
