import { useRef } from 'react';
import { hexToRgba } from '../utils/hexToRgba';

export const BackgroundElement = ({ element }) => {
  const containerRef = useRef(null);

  // Стили для основного div (цвет/градиент)
  const getOverlayStyle = () => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    ...(element.gradient ? {
      backgroundImage: `linear-gradient(${element.gradient.direction}, 
        ${hexToRgba(element.gradient.colors[0], element.gradient.opacity[0])}, 
        ${hexToRgba(element.gradient.colors[1], element.gradient.opacity[1])})`
    } : {
      backgroundColor: element.color || '#ccddea'
    }),
    opacity: element.opacity,
    //mixBlendMode: element.backgroundImage ? 'overlay' : 'normal'
  });

  // Стили для контейнера
  const getContainerStyle = () => ({
    position: 'relative',
    top: -1,
    left: -1,
    width: `${element.width}px`,
    height: `${element.height}px`,
    border: 'none',
    overflow: 'hidden'
  });

  // Стили для фонового изображения
  const getImageStyle = () => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: element.backgroundImage ? 'block' : 'none',

  });

  return (
    <div ref={containerRef} style={getContainerStyle()}>
      {/* Цвет/градиент сверху */}
      <div style={getOverlayStyle()} />

      {/* Изображение внизу */}
      {element.backgroundImage && (
        <img
          src={element.backgroundImage}
          alt=""
          style={getImageStyle()}
          onError={(e) => e.target.style.display = 'none'}
        />
      )}
    </div>
  );
};