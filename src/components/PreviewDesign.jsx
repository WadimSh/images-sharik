import { hexToRgba } from "../utils/hexToRgba";
import img from "../assets/fallback.png";

export const PreviewDesign = ({ elements, size }) => {
  // Парсим размер из формата "900x1200" - это реальный размер файла
  const [realWidth, realHeight] = size ? size.split('x').map(Number) : [900, 1200];
  
  // Размеры в данных (в 2 раза меньше реальных)
  const dataWidth = realWidth / 2;
  const dataHeight = realHeight / 2;
  
  // Размеры карточки превью (фиксированные)
  const previewCardWidth = 270;
  const previewCardHeight = 360;
  
  // Коэффициенты масштабирования из данных в превью
  const scaleX = previewCardWidth / dataWidth;
  const scaleY = previewCardHeight / dataHeight;
  
  // Используем минимальный коэффициент для сохранения пропорций
  const scale = Math.min(scaleX, scaleY);
  
  // Вычисляем фактические размеры превью внутри карточки
  const previewWidth = dataWidth * scale;
  const previewHeight = dataHeight * scale;
  
  // Смещения для центрирования
  const offsetX = (previewCardWidth - previewWidth) / 2;
  const offsetY = (previewCardHeight - previewHeight) / 2;

  const renderArrow = (element, type) => {
    if (!element.lineEnds || element.lineEnds[type] !== 'arrow') return null;
      
    const arrowStyle = {
      position: 'absolute',
      width: '0',
      height: '0',
      borderStyle: 'solid',
      top: '50%',
      transform: 'translateY(-50%)'
    };

    const thickness = (element.lineThickness || 2) * scale;
    const arrowSize = Math.max(7, thickness * 2);

    if (type === 'start') {
      return (
        <div
          style={{
            ...arrowStyle,
            left: `-${arrowSize}px`,
            borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
            borderColor: `transparent ${element.color} transparent transparent`,
            marginLeft: `${arrowSize - (thickness / 2)}px`
          }}
        />
      );
    } else {
      return (
        <div
          style={{
            ...arrowStyle,
            right: `-${arrowSize}px`,
            borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
            borderColor: `transparent transparent transparent ${element.color}`,
            marginRight: `${arrowSize - (thickness / 2)}px`
          }}
        />
      );
    }
  };

  return (
    <div 
      className="preview-container" 
      style={{ 
        width: previewCardWidth, 
        height: previewCardHeight,
        position: 'relative',
        overflow: 'hidden',
        // Шашечный фон для всей карточки
        backgroundImage: `
          linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
          linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
          linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
      }}
    >
      {/* Контейнер для области холста с белым фоном и границей */}
      <div
        style={{
          position: 'relative',
          left: offsetX,
          top: offsetY,
          width: previewWidth,
          height: previewHeight,
          backgroundColor: 'white',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >

      {/* Контейнер для масштабированного контента - БЕЗ overflow hidden */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: previewWidth,
          height: previewHeight,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {elements.map((element) => {
          const style = {
            left: element.position.x,
            top: element.position.y,
            width: element.width,
            height: element.height,
            transform: `rotate(${element.rotation || 0}deg) scaleX(${element.isFlipped ? -1 : 1})`,
            transformOrigin: 'center',
            position: 'absolute'
          };

          switch (element.type) {
            case 'image':
              return (
                <img 
                  key={element.id} 
                  src={element.image === "{{ITEM_IMAGE}}" ? img : element.image} 
                  style={{
                    ...style,
                    objectFit: 'cover',
                  }} 
                  className="preview-element" 
                />
              );
            case 'element':
              return (
                <img 
                  key={element.id} 
                  src={element.image} 
                  style={{
                    ...style,
                    objectFit: 'cover',
                  }} 
                  className="preview-element" 
                />
              );
            case 'text':
              return (
                <div 
                  key={element.id} 
                  style={{
                    ...style,
                    fontSize: `${(element.fontSize || 24)}px`,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    color: element.color,
                    textDecoration: element.textDecoration || 'none',
                    textAlign: element.textAlign || 'left',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'normal',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    lineHeight: 1,
                  }}
                >
                  {element.text.split('\n').map((line, i) => (
                    <span key={i} style={{ width: '100%', display: 'block' }}>
                      {line}
                    </span>
                  ))}
                </div>
              );
            case 'shape':
              return (
                <div 
                  key={element.id} 
                  style={{
                    ...style, 
                    boxSizing: 'border-box',
                    border: element.borderWidth && element.borderColor 
                      ? `${element.borderWidth}px solid ${element.borderColor}`
                      : 'none',
                    opacity: element.opacity,
                    background: element.gradient 
                      ? `linear-gradient(${element.gradient.direction}, 
                        ${hexToRgba(element.gradient.colors[0], element.gradient.opacity[0])} ${element.gradient.start}%, 
                        ${hexToRgba(element.gradient.colors[1], element.gradient.opacity[1])})`
                      : element.color,
                    borderRadius: `${element.borderRadius?.topLeft || 0}px ${element.borderRadius?.topRight || 0}px 
                      ${element.borderRadius?.bottomRight || 0}px ${element.borderRadius?.bottomLeft || 0}px`
                  }} 
                  className="preview-shape" 
                />
              );
            case 'line': 
              return (
                <div
                  key={element.id} 
                  style={{
                    ...style, 
                    top: element.position.y + (element.height / 2),
                    height: `${element.lineThickness || 2}px`,
                    backgroundColor: element.color,
                    opacity: element.opacity || 1,
                    borderRadius: element.lineStyle === 'dashed' ? '2px' : '0px'
                  }}
                >
                  {renderArrow(element, 'start')}
                  {renderArrow(element, 'end')}
                </div>
              );
            case 'background':
              return (
                <div key={element.id} style={{
                    ...style,
                    width: dataWidth,
                    height: dataHeight,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      ...(element.gradient 
                        ? {
                            backgroundImage: `linear-gradient(${element.gradient.direction}, 
                              ${hexToRgba(element.gradient.colors[0], element.gradient.opacity[0])}, 
                              ${hexToRgba(element.gradient.colors[1], element.gradient.opacity[1])}${
                                element.gradient.colors[2] 
                                  ? `, ${hexToRgba(element.gradient.colors[2], element.gradient.opacity[2])}` 
                                  : ''
                              })`
                          }
                        : {
                            backgroundColor: element.color || '#ccddea'
                          }),
                      opacity: element.opacity,
                    }}
                  />
                  {element.backgroundImage && (
                    <img
                      src={element.backgroundImage}
                      alt=""
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill',
                        objectPosition: 'center',
                      }}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
      </div>
    </div>
  );
};