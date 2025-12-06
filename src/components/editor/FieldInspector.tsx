import React from 'react';
import type { TextField } from '../../lib/templates';

type Props = {
  field: TextField;
  onChange: (field: TextField) => void;
  onDelete?: () => void;
};

export const FieldInspector: React.FC<Props> = ({ field, onChange, onDelete }) => {
  const update = (patch: Partial<TextField>) => onChange({ ...field, ...patch });

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
        <input
          type="text"
          value={field.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          style={{ width: '100%' }}
        />
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


