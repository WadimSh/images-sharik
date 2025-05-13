import { useDrag, useDrop } from 'react-dnd';

export const DraggableElementItem = ({ element, elements, originalIndex, moveElement, children }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: { id: element.id, originalIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        moveElement(item.originalIndex, originalIndex);
      }
    },
  });

  const [, drop] = useDrop({
    accept: 'element',
    hover({ id: draggedId }) {
      if (draggedId !== element.id) {
        const draggedIndex = elements.findIndex(el => el.id === draggedId);
        const targetIndex = elements.findIndex(el => el.id === element.id);
        moveElement(draggedIndex, targetIndex);
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {children}
    </div>
  );
};