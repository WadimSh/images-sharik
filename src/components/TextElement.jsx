import DraggableElement from './DraggableElement';

export const TextElement = ({ text, position, onDrag, onRemove, containerWidth, containerHeight }) => {
  return (
    <DraggableElement
      position={position}
      onDrag={onDrag}
      onRemove={onRemove}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
    >
      <div style={{ 
        color: '#333',
        fontSize: '24px',
        fontFamily: 'Arial',
        whiteSpace: 'nowrap'
      }}>
        {text}
      </div>
    </DraggableElement>
  );
};