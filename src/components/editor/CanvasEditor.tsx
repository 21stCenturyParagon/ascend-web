import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import type { FC, RefObject } from 'react';
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { KonvaEventObject } from 'konva/lib/Node';
import Konva from 'konva';
import type { TemplateConfig, TemplateElement, TextField, TableColumn } from '../../lib/templates';
import { loadFont } from '../../lib/fonts';

type RenderData = {
  singleValues?: Record<string, string>;
  columnData?: Record<string, string[]>;
};

type Props = {
  backgroundUrl?: string;
  config: TemplateConfig;
  data?: RenderData;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onUpdateElement?: (element: TemplateElement) => void;
  editable?: boolean;
  stageRef?: RefObject<StageType | null>;
};

const Background: FC<{ url?: string; width: number; height: number }> = ({ url, width, height }) => {
  // Use 'anonymous' crossOrigin to allow toDataURL() export
  const [image] = useImage(url || '', 'anonymous');
  if (!url || !image) return null;
  return <KonvaImage image={image} width={width} height={height} listening={false} />;
};

// Text field component with resize support
const EditableTextField: FC<{
  el: TextField;
  value: string;
  isSelected: boolean;
  editable: boolean;
  onSelect: () => void;
  onUpdate: (updated: TextField) => void;
  transformerRef: React.RefObject<Konva.Transformer | null>;
}> = ({ el, value, isSelected, editable, onSelect, onUpdate, transformerRef }) => {
  const shapeRef = useRef<Konva.Rect>(null);

  useEffect(() => {
    if (isSelected && editable && shapeRef.current && transformerRef.current) {
      // Attach transformer to this node
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, editable, transformerRef]);

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    onUpdate({
      ...el,
      x: Math.round(e.target.x()),
      y: Math.round(e.target.y()),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale
    node.scaleX(1);
    node.scaleY(1);

    onUpdate({
      ...el,
      x: Math.round(node.x()),
      y: Math.round(node.y()),
      width: Math.max(40, Math.round(node.width() * scaleX)),
      height: Math.max(24, Math.round(node.height() * scaleY)),
    });
  };

  return (
    <Group>
      <Rect
        ref={shapeRef}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        stroke={isSelected ? '#2563eb' : '#9ca3af'}
        dash={isSelected ? undefined : [4, 4]}
        strokeWidth={isSelected ? 2 : 1}
        fill={isSelected ? 'rgba(37,99,235,0.05)' : 'transparent'}
        draggable={editable}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect();
        }}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      <Text
        x={el.x}
        y={el.y}
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
        verticalAlign={el.verticalAlign ?? 'middle'}
        padding={4}
        listening={false}
      />
    </Group>
  );
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
  const transformerRef = useRef<Konva.Transformer>(null);
  const [fontVersion, setFontVersion] = useState(0);

  const currentStageRef = stageRef ?? internalStageRef;

  const selectedElement = useMemo(
    () => config.elements.find((el) => el.id === selectedId) ?? null,
    [config.elements, selectedId],
  );

  // Load all fonts used in elements and force re-render when loaded
  useEffect(() => {
    const loadAllFonts = async () => {
      const fonts = new Set(config.elements.map((el) => el.fontFamily));
      await Promise.all([...fonts].map((font) => loadFont(font)));
      // Force canvas to re-render with loaded fonts
      setFontVersion((v) => v + 1);
    };
    void loadAllFonts();
  }, [config.elements]);

  // Clear transformer when nothing is selected or non-text is selected
  useEffect(() => {
    if (!transformerRef.current) return;
    if (!selectedId || !selectedElement || selectedElement.type !== 'text') {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, selectedElement]);

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Only deselect if clicking on the stage itself (not on any shape)
    if (e.target === e.target.getStage()) {
      onSelect?.(null);
    }
  }, [onSelect]);

  const handleUpdate = useCallback((updated: TemplateElement) => {
    onUpdateElement?.(updated);
  }, [onUpdateElement]);

  const handleDragEnd = (el: TemplateElement, evt: KonvaEventObject<DragEvent>) => {
    if (!onUpdateElement) return;
    const { x, y } = evt.target.position();
    onUpdateElement({ ...el, x: Math.round(x), y: Math.round(y) });
  };

  const renderColumn = (el: TableColumn, fontVer: number) => {
    const values = data?.columnData?.[el.id] ?? [];
    const showRows = values.length ? values : Array.from({ length: el.maxRows }).map((_, idx) => `Row ${idx + 1}`);
    const isSelected = selectedId === el.id;

    return (
      <Group
        key={`${el.id}-${fontVer}`}
        x={el.x}
        y={el.y}
        draggable={editable}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect?.(el.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect?.(el.id);
        }}
        onDragEnd={(evt) => handleDragEnd(el, evt)}
      >
        {showRows.map((text, rowIndex) => {
          const y = rowIndex * (el.rowHeight + el.rowGap);
          return (
            <Group key={`${el.id}-row-${rowIndex}`} y={y}>
              <Rect
                width={el.width}
                height={el.rowHeight}
                stroke={isSelected ? '#2563eb' : '#d1d5db'}
                strokeWidth={isSelected ? 2 : 1}
                fill={isSelected ? 'rgba(37,99,235,0.03)' : 'transparent'}
              />
              <Text
                text={text}
                width={el.width}
                height={el.rowHeight}
                fontFamily={el.fontFamily}
                fontSize={el.fontSize}
                fontStyle={el.fontWeight ? 'bold' : 'normal'}
                lineHeight={1.2}
                fill={el.fill}
                align={el.align}
                verticalAlign={el.verticalAlign ?? 'middle'}
                padding={4}
                listening={false}
              />
            </Group>
          );
        })}
      </Group>
    );
  };

  return (
    <Stage
      width={config.canvas.width}
      height={config.canvas.height}
      ref={currentStageRef}
      onClick={handleStageClick}
      onTap={handleStageClick}
      style={{ border: '1px solid #e5e7eb', background: '#f8fafc' }}
    >
      <Layer listening={false}>
        <Background url={backgroundUrl} width={config.canvas.width} height={config.canvas.height} />
      </Layer>
      <Layer>
        {config.elements.map((el) =>
          el.type === 'text' ? (
            <EditableTextField
              key={`${el.id}-${fontVersion}`}
              el={el}
              value={data?.singleValues?.[el.key] ?? el.key}
              isSelected={selectedId === el.id}
              editable={editable}
              onSelect={() => onSelect?.(el.id)}
              onUpdate={handleUpdate}
              transformerRef={transformerRef}
            />
          ) : (
            renderColumn(el, fontVersion)
          )
        )}
        {editable && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            keepRatio={false}
            flipEnabled={false}
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
              // Limit minimum size
              if (newBox.width < 40 || newBox.height < 20) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </Layer>
    </Stage>
  );
};

export default CanvasEditor;
