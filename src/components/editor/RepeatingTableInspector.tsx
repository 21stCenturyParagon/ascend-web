import React from 'react';
import type { RepeatingTable, TableColumn } from '../../lib/templates';

type Props = {
  table: RepeatingTable;
  onChange: (table: RepeatingTable) => void;
  onDelete?: () => void;
};

export const RepeatingTableInspector: React.FC<Props> = ({ table, onChange, onDelete }) => {
  const update = (patch: Partial<RepeatingTable>) => onChange({ ...table, ...patch });

  const updateColumn = (idx: number, patch: Partial<TableColumn>) => {
    const columns = table.columns.map((col, i) => (i === idx ? { ...col, ...patch } : col));
    update({ columns });
  };

  const addColumn = () => {
    const next: TableColumn = {
      key: `col_${table.columns.length + 1}`,
      x: table.columns.reduce((acc, col) => acc + col.width, 0),
      width: 120,
      align: 'left',
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 600,
      fill: '#000000',
    };
    update({ columns: [...table.columns, next] });
  };

  const deleteColumn = (idx: number) => {
    const columns = table.columns.filter((_, i) => i !== idx);
    update({ columns });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{ margin: '8px 0 4px', fontWeight: 600 }}>Repeating Table</h3>
      <label>
        Max Rows
        <input
          type="number"
          min={1}
          value={table.maxRows}
          onChange={(e) => update({ maxRows: Math.max(1, Number(e.target.value) || table.maxRows) })}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Row Height
        <input
          type="number"
          min={12}
          value={table.rowHeight}
          onChange={(e) => update({ rowHeight: Math.max(12, Number(e.target.value) || table.rowHeight) })}
          style={{ width: '100%' }}
        />
      </label>
      <label>
        Row Gap
        <input
          type="number"
          min={0}
          value={table.rowGap ?? 0}
          onChange={(e) => update({ rowGap: Math.max(0, Number(e.target.value) || 0) })}
          style={{ width: '100%' }}
        />
      </label>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Columns</strong>
        <button onClick={addColumn} style={{ padding: '4px 10px' }}>
          + Add Column
        </button>
      </div>
      {table.columns.map((col, idx) => (
        <div
          key={col.key}
          style={{ border: '1px solid #e5e7eb', padding: 8, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          <label>
            Key
            <input
              type="text"
              value={col.key}
              onChange={(e) => updateColumn(idx, { key: e.target.value })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            X Position
            <input
              type="number"
              value={col.x}
              onChange={(e) => updateColumn(idx, { x: Number(e.target.value) || col.x })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Width
            <input
              type="number"
              value={col.width}
              onChange={(e) => updateColumn(idx, { width: Math.max(40, Number(e.target.value) || col.width) })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Align
            <select value={col.align} onChange={(e) => updateColumn(idx, { align: e.target.value as TableColumn['align'] })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label>
            Font Family
            <input
              type="text"
              value={col.fontFamily}
              onChange={(e) => updateColumn(idx, { fontFamily: e.target.value })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Font Size
            <input
              type="number"
              value={col.fontSize}
              onChange={(e) => updateColumn(idx, { fontSize: Number(e.target.value) || col.fontSize })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Font Weight
            <input
              type="number"
              value={col.fontWeight ?? 400}
              onChange={(e) => updateColumn(idx, { fontWeight: Number(e.target.value) || 400 })}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Color
            <input type="color" value={col.fill} onChange={(e) => updateColumn(idx, { fill: e.target.value })} />
          </label>
          <button
            onClick={() => deleteColumn(idx)}
            style={{ alignSelf: 'flex-start', background: '#fee2e2', border: '1px solid #ef4444', padding: '6px 10px' }}
          >
            Delete Column
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onDelete} style={{ background: '#fee2e2', border: '1px solid #ef4444', padding: '6px 10px' }}>
          Delete Table
        </button>
      </div>
    </div>
  );
};

export default RepeatingTableInspector;


