import { useEffect, useMemo, useRef } from 'react';
import type { FC, RefObject } from 'react';
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { KonvaEventObject } from 'konva/lib/Node';
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
  stageRef?: RefObject<StageType>;
};

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
    // Ensure fonts used in elements are loaded into the document.
    config.elements.forEach((el) => {
      loadFont(el.fontFamily);
    });
  }, [config.elements]);

  useEffect(() => {
    if (!editable || !transformerRef.current) return;
    const stage = currentStageRef.current;
    const transformer = transformerRef.current;
    
    if (!stage || !selectedNodeName || !selectedElement || selectedElement.type !== 'text') {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }
    
    // Small delay to ensure the node is rendered
    setTimeout(() => {
      const node = stage.findOne(`.${selectedNodeName}`);
      if (node) {
        transformer.nodes([node]);
        transformer.forceUpdate();
        transformer.getLayer()?.batchDraw();
      } else {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
      }
    }, 0);
  }, [editable, selectedNodeName, selectedElement, currentStageRef, config.elements]);

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
    const node = evt.target as any;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    // Calculate new dimensions based on current scale
    const newWidth = Math.max(40, Math.round(el.width * scaleX));
    const newHeight = Math.max(24, Math.round(el.height * scaleY));
    
    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);
    
    // Update element with new dimensions
    onUpdateElement({
      ...el,
      x: Math.round(node.x()),
      y: Math.round(node.y()),
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
          dash={selectedId === el.id ? undefined : [4, 4]}
          strokeWidth={selectedId === el.id ? 2 : 1}
          fill={selectedId === el.id ? 'rgba(37,99,235,0.05)' : 'transparent'}
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

  const renderColumn = (el: TableColumn) => {
    const values = data?.columnData?.[el.id] ?? [];
    const showRows = values.length ? values : Array.from({ length: el.maxRows }).map((_, idx) => `Row ${idx + 1}`);

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
        {showRows.map((text, rowIndex) => {
          const y = rowIndex * (el.rowHeight + el.rowGap);
          return (
            <Group key={`${el.id}-row-${rowIndex}`} y={y}>
              <Rect
                width={el.width}
                height={el.rowHeight}
                stroke={selectedId === el.id ? '#2563eb' : '#d1d5db'}
                strokeWidth={1}
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
                verticalAlign="middle"
                padding={4}
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
      onMouseDown={handleStageClick}
      style={{ border: '1px solid #e5e7eb', background: '#f8fafc' }}
    >
      <Layer listening={false}>
        <Background url={backgroundUrl} width={config.canvas.width} height={config.canvas.height} />
      </Layer>
      <Layer>
        {config.elements.map((el) => (el.type === 'text' ? renderTextField(el) : renderColumn(el)))}
        {editable && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            keepRatio={false}
            resizeEnabled={true}
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


