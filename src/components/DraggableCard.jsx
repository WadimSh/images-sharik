import { useRef } from "react";
import { useDrag, useDrop } from 'react-dnd';

import { PreviewDesign } from "./PreviewDesign";

const DraggableCard = ({ item, index, moveCard, handleDelete }) => {
  const ref = useRef(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'CARD',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CARD',
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;

      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div 
        className="item-card" 
        style={{ 
          flexDirection: 'column', 
          width: '270px', 
          height: '360px',
        }}
      >
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(item);
          }}
        >
          ×
        </button>

        <div style={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          fontSize: 'calc(12px + 0.5vw - 0.5vh)',
          aspectRatio: '3/4',
          boxSizing: 'border-box',
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab' 
          }}
        >
          <PreviewDesign elements={item} />
        </div>
      </div>
    </div>
  );
};

export default DraggableCard;