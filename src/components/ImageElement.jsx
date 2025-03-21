import DraggableElement from './DraggableElement';

export const ImageElement = ({ src, position, onDrag, onRemove, containerWidth, containerHeight }) => {
  return (
    <DraggableElement
      position={position}
      onDrag={onDrag}
      onRemove={onRemove}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
    >
      <img
        src={src}
        alt="uploaded"
        style={{ 
          maxWidth: '200px',
          maxHeight: '200px',
          pointerEvents: 'none' 
        }}
      />
    </DraggableElement>
  );
};