import React, { useEffect, useMemo, useState } from 'react';
import type { TextField } from '../../lib/templates';
import { fetchGoogleFonts, loadFont } from '../../lib/fonts';

type Props = {
  field: TextField;
  onChange: (field: TextField) => void;
  onDelete?: () => void;
};

export const FieldInspector: React.FC<Props> = ({ field, onChange, onDelete }) => {
  const update = (patch: Partial<TextField>) => onChange({ ...field, ...patch });

  const [fonts, setFonts] = useState<string[]>([]);

  useEffect(() => {
    void fetchGoogleFonts().then((list) => setFonts(list));
  }, []);

  useEffect(() => {
    loadFont(field.fontFamily);
  }, [field.fontFamily]);

  const fontOptions = useMemo(() => (fonts.length ? fonts : [field.fontFamily]), [fonts, field.fontFamily]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={{ margin: '8px 0 4px', fontWeight: 600 }}>Text Field</h3>
      <label>
        Key (CSV column)
        <input
          type="text"
          value={field.key}
          onChange={(e) => update({ key: e.target.value })}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Font Family
        <select value={field.fontFamily} onChange={(e) => update({ fontFamily: e.target.value })}>
          {fontOptions.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </label>
      <label>
        Font Size
        <input
          type="number"
          value={field.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) || field.fontSize })}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Line Height
        <input
          type="number"
          step="0.1"
          min={1}
          value={field.lineHeight ?? 1.2}
          onChange={(e) => update({ lineHeight: Math.max(1, Number(e.target.value) || 1.2) })}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Font Weight
        <input
          type="number"
          value={field.fontWeight ?? 400}
          onChange={(e) => update({ fontWeight: Number(e.target.value) || 400 })}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Color
        <input type="color" value={field.fill} onChange={(e) => update({ fill: e.target.value })} />
      </label>
      <label>
        Align
        <select value={field.align} onChange={(e) => update({ align: e.target.value as TextField['align'] })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onDelete} style={{ background: '#fee2e2', border: '1px solid #ef4444', padding: '6px 10px' }}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default FieldInspector;


