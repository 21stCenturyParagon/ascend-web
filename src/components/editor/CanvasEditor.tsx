import { useEffect, useMemo, useRef } from 'react';
import type { FC, RefObject } from 'react';
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { TemplateConfig, TemplateElement, TextField, RepeatingTable } from '../../lib/templates';

type RenderData = {
  singleValues?: Record<string, string>;
  tableRows?: Record<string, string>[];
};

type Props = {
  backgroundUrl?: string;
  config: TemplateConfig;
  data?: RenderData;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onUpdateElement?: (element: TemplateElement) => void;
  editable?: boolean;
  stageRef?: RefObject<StageType>;
};

const Placeholder: FC<{ text: string; width: number; height: number }> = ({ text, width, height }) => (
  <Group>
    <Rect width={width} height={height} stroke="#4b5563" dash={[6, 6]} cornerRadius={4} />
    <Text text={text} width={width} height={height} align="center" verticalAlign="middle" fill="#4b5563" />
  </Group>
);

const Background: FC<{ url?: string; width: number; height: number }> = ({ url, width, height }) => {
  const [image] = useImage(url || '');
  if (!url || !image) return null;
  return <KonvaImage image={image} width={width} height={height} listening={false} />;
};

export const CanvasEditor: FC<Props> = ({
  backgroundUrl,
  config,
  data,
  selectedId,
  onSelect,
  onUpdateElement,
  editable = true,
  stageRef,
}) => {
  const internalStageRef = useRef<StageType>(null);
  const transformerRef = useRef<any>(null);

  const currentStageRef = stageRef ?? internalStageRef;

  const selectedElement = useMemo(
    () => config.elements.find((el) => el.id === selectedId) ?? null,
    [config.elements, selectedId],
  );
  const selectedNodeName = useMemo(() => (selectedId ? `node-${selectedId}` : null), [selectedId]);

  useEffect(() => {
    if (!transformerRef.current) return;
    const stage = currentStageRef.current;
    const transformer = transformerRef.current;
    if (!stage || !selectedNodeName || !selectedElement || selectedElement.type !== 'text') {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }
    const node = stage.findOne(`.${selectedNodeName}`);
    if (node) {
      transformer.nodes([node]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedNodeName, currentStageRef]);

  const handleStageClick = () => {
    if (onSelect) onSelect(null);
  };

  const handleDragEnd = (el: TemplateElement, evt: KonvaEventObject<DragEvent>) => {
    if (!onUpdateElement) return;
    const { x, y } = evt.target.position();
    if (el.type === 'text') {
      onUpdateElement({ ...el, x, y });
    } else {
      onUpdateElement({ ...el, x, y });
    }
  };

  const handleTransformEnd = (el: TemplateElement, evt: KonvaEventObject<Event>) => {
    if (!onUpdateElement || el.type !== 'text') return;
    const node = evt.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newWidth = Math.max(40, node.width() * scaleX);
    const newHeight = Math.max(24, node.height() * scaleY);
    node.scaleX(1);
    node.scaleY(1);
    onUpdateElement({
      ...el,
      x: node.x(),
      y: node.y(),
      width: newWidth,
      height: newHeight,
    });
  };

  const renderTextField = (el: TextField) => {
    const value = data?.singleValues?.[el.key] ?? el.key;
    return (
      <Group
        key={el.id}
        x={el.x}
        y={el.y}
        draggable={editable}
        name={`node-${el.id}`}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect?.(el.id);
        }}
        onDragEnd={(evt) => handleDragEnd(el, evt)}
        onTransformEnd={(evt) => handleTransformEnd(el, evt)}
      >
        <Rect
          width={el.width}
          height={el.height}
          stroke={selectedId === el.id ? '#2563eb' : '#9ca3af'}
          dash={[4, 4]}
          strokeWidth={1}
        />
        <Text
          text={value}
          width={el.width}
          height={el.height}
          fontFamily={el.fontFamily}
          fontSize={el.fontSize}
          fontStyle={el.fontWeight ? 'bold' : 'normal'}
          lineHeight={el.lineHeight ?? 1.2}
          wrap="word"
          fill={el.fill}
          align={el.align}
          verticalAlign="middle"
          padding={4}
        />
      </Group>
    );
  };

  const renderTable = (el: RepeatingTable) => {
    const rows = data?.tableRows?.slice(0, el.maxRows) ?? [];
    const showRows: Array<Record<string, string> | { __placeholder: number }> =
      rows.length ? rows : Array.from({ length: el.maxRows }).map((_, idx) => ({ __placeholder: idx + 1 }));
    const rowGap = el.rowGap ?? 0;
    const handleColumnDrag = (colIdx: number, deltaX: number) => {
      if (!onUpdateElement) return;
      const updated = {
        ...el,
        columns: el.columns.map((c, i) => (i === colIdx ? { ...c, x: c.x + deltaX } : c)),
      };
      onUpdateElement(updated);
    };

    const handleColumnResize = (colIdx: number, newWidth: number) => {
      if (!onUpdateElement) return;
      const updated = {
        ...el,
        columns: el.columns.map((c, i) => (i === colIdx ? { ...c, width: newWidth } : c)),
      };
      onUpdateElement(updated);
    };

    return (
      <Group
        key={el.id}
        x={el.x}
        y={el.y}
        draggable={editable}
        name={`node-${el.id}`}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect?.(el.id);
        }}
        onDragEnd={(evt) => handleDragEnd(el, evt)}
      >
        {showRows.map((row, rowIndex) => {
          const y = rowIndex * (el.rowHeight + rowGap);
          return (
            <Group key={`${el.id}-row-${rowIndex}`} y={y}>
              {el.columns.map((col) => {
                const x = col.x;
                const text =
                  '__placeholder' in row
                    ? String(row.__placeholder)
                    : (row as Record<string, string>)[col.key] ?? col.key;
                return (
                  <Group key={`${el.id}-row-${rowIndex}-col-${col.key}`} x={x}>
                    <Rect
                      width={col.width}
                      height={el.rowHeight}
                      stroke={selectedId === el.id ? '#2563eb' : '#d1d5db'}
                      strokeWidth={1}
                    />
                    <Text
                      text={text}
                      width={col.width}
                      height={el.rowHeight}
                      fontFamily={col.fontFamily}
                      fontSize={col.fontSize}
                      fontStyle={col.fontWeight ? 'bold' : 'normal'}
                      lineHeight={1.2}
                      fill={col.fill}
                      align={col.align}
                      verticalAlign="middle"
                      padding={4}
                    />
                  </Group>
                );
              })}
            </Group>
          );
        })}
        {!showRows.length && <Placeholder text="Repeating table" width={200} height={el.rowHeight} />}

        {editable && (
          <Group>
            {el.columns.map((col, colIdx) => (
              <Group key={`${el.id}-col-handle-${col.key}`} x={col.x} y={-18}>
                <Rect
                  width={col.width}
                  height={16}
                  fill="rgba(37,99,235,0.08)"
                  stroke="#2563eb"
                  cornerRadius={4}
                  draggable
                  onDragEnd={(evt) => {
                    const deltaX = evt.target.x();
                    handleColumnDrag(colIdx, deltaX);
                    evt.target.position({ x: 0, y: -18 });
                  }}
                />
                <Text
                  text={col.key}
                  width={col.width}
                  height={16}
                  align="center"
                  verticalAlign="middle"
                  fontSize={12}
                  fill="#2563eb"
                  fontStyle="bold"
                />
                <Rect
                  x={col.width - 6}
                  y={0}
                  width={12}
                  height={16}
                  fill="rgba(37,99,235,0.18)"
                  stroke="#2563eb"
                  strokeWidth={0.5}
                  draggable
                  dragBoundFunc={(pos) => ({ x: Math.max(20, pos.x), y: 0 })}
                  onDragEnd={(evt) => {
                    const newWidth = Math.max(40, col.width + evt.target.x() - (col.width - 6));
                    handleColumnResize(colIdx, newWidth);
                    evt.target.position({ x: col.width - 6, y: 0 });
                  }}
                />
              </Group>
            ))}
          </Group>
        )}
      </Group>
    );
  };

  return (
    <Stage
      width={config.canvas.width}
      height={config.canvas.height}
      ref={currentStageRef}
      onMouseDown={handleStageClick}
      style={{ border: '1px solid #e5e7eb', background: '#f8fafc' }}
    >
      <Layer listening={false}>
        <Background url={backgroundUrl} width={config.canvas.width} height={config.canvas.height} />
      </Layer>
      <Layer>
        {config.elements.map((el) => (el.type === 'text' ? renderTextField(el) : renderTable(el)))}
        {editable && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            enabledAnchors={[
              'top-left',
              'top-center',
              'top-right',
              'middle-left',
              'middle-right',
              'bottom-left',
              'bottom-center',
              'bottom-right',
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 40 || newBox.height < 20) return oldBox;
              return newBox;
            }}
          />
        )}
      </Layer>
    </Stage>
  );
};

export default CanvasEditor;


