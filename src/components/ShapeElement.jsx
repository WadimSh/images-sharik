import DraggableElement from './DraggableElement';

export const ShapeElement = ({ position, onDrag, onRemove, containerWidth, containerHeight }) => {
  return (
    <DraggableElement
      position={position}
      onDrag={onDrag}
      onRemove={onRemove}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
    >
      <div style={{ 
        width: '100px',
        height: '100px',
        backgroundColor: '#4CAF50',
        border: '2px solid #388E3C'
      }} />
    </DraggableElement>
  );
};