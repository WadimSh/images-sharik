import { useRef } from 'react';

import { hexToRgba } from '../utils/hexToRgba';

export const BackgroundElement = ({ 
  color = '#ccddea', // Получаем цвет из пропсов
  element,
}) => {
  const containerRef = useRef(null);
    
  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative',
        width: `${element.width}px`,
        height: `${element.height}px`,
        background: element.gradient 
          ? `linear-gradient(${element.gradient.direction}, 
              ${hexToRgba(element.gradient.colors[0], element.gradient.opacity[0])} ${element.gradient.start}%, 
              ${hexToRgba(element.gradient.colors[1], element.gradient.opacity[1])} 100%)`
          : color,
        backgroundBlendMode: element.gradient ? 'normal' : 'unset',
        border: 'none',
        opacity: element.opacity,
      }}
    />
  );
};