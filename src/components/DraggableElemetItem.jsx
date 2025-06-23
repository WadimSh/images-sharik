import { useDrag, useDrop } from 'react-dnd';

export const DraggableElementItem = ({ 
  element, 
  elements, 
  originalIndex, 
  moveElement,
  disabled, 
  setExpandedElementId,
  isBackground,
  children 
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'element',
    item: () => {
      setExpandedElementId(null); // Закрываем меню при начале перетаскивания
      return { id: element.id, originalIndex };
    },
    canDrag: () => !disabled && !isBackground, // Блокируем перетаскивание при disabled=true
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
    canDrop: () => !isBackground, // Запрещаем дроп на background элемент
    hover({ id: draggedId }) {
      if (!moveElement || isBackground) return;

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
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: isBackground && 'default'  
      }}
    >
      {children}
    </div>
  );
};