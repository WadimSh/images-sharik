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
      className={`draggable-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="item card-item">
        <button
          className="button-delete"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(item);
          }}
        >
          ×
        </button>

        <div className="card-preview-container" data-dragging={isDragging}>
          <PreviewDesign elements={item} />
        </div>
      </div>
    </div>
  );
};

export default DraggableCard;