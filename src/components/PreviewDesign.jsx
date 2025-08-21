import { hexToRgba } from "../utils/hexToRgba";
import img from "../assets/fallback.png";

export const PreviewDesign = ({ elements }) => (
  
  <div className="preview-container">
    {elements.map((element) => {
      const style = {
        left: `${(element.position.x / 450) * 100}%`,
        top: `${(element.position.y / 600) * 100}%`,
        width: `${(element.width / 450) * 100}%`,
        height: `${(element.height / 600) * 100}%`,
        transform: `rotate(${element.rotation || 0}deg) scaleX(${element.isFlipped ? -1 : 1})`,
        transformOrigin: 'center',
        position: 'absolute'
      };
      switch (element.type) {
        case 'image':
          return <img key={element.id} src={element.image === "{{ITEM_IMAGE}}" ? img : element.image} 
                   style={{
                    ...style,
                    objectFit: 'cover',
                  }} className="preview-element" />;
        case 'element':
          return <img key={element.id} src={element.image} 
                   style={{
                    ...style,
                    objectFit: 'cover',
                  }} className="preview-element" />;
        case 'text':
          return (
            <div 
                  key={element.id} 
                  style={{
                    ...style,
                    fontSize: `${(element.fontSize || 24) * 0.6}px`,
                    fontFamily: element.fontFamily,
                    fontWeight: element.fontWeight,
                    fontStyle: element.fontStyle,
                    color: element.color,
                    // display: 'flex',
                    // flexDirection: 'column',
                    // alignItems: element.textAlign?.horizontal || 'flex-start',
                    //justifyContent: element.textAlign?.vertical || 'flex-start',
                    textDecoration: element.textDecoration || 'none',
                    textAlign: element.textAlign || 'left',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    lineHeight: 1,
                    width: `${(element.width / 450) * 100}%`,
                    height: `${(element.height / 600) * 100}%`,
                  }}
                >
                  {element.text.split('\n').map((line, i) => (
                    <span key={i} style={{
                      width: '100%',
                      display: 'block'
                    }}>
                      {line}
                    </span>
                  ))}
                </div>
            
          );
        case 'shape':
          return <div key={element.id} 
                   style={{
                    ...style, 
                    border: 'none',
                    opacity: element.opacity,
                    background: element.gradient 
                                ? `linear-gradient(${element.gradient.direction}, 
                                  ${hexToRgba(element.gradient.colors[0], element.gradient.opacity[0])}  ${element.gradient.start}%, 
                                  ${hexToRgba(element.gradient.colors[1], element.gradient.opacity[1])})`
                                : element.color,
                    borderRadius: `${element.borderRadius?.topLeft || 0}px ${element.borderRadius?.topRight || 0}px 
                      ${element.borderRadius?.bottomRight || 0}px ${element.borderRadius?.bottomLeft || 0}px`
                  }} 
                   className="preview-shape" />;
        case 'background':
          return (
            <div key={element.id} style={style}>
              {/* Цвет/градиент (верхний слой) */}
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
              {/* Фоновое изображение (нижний слой) */}
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
                    objectFit: 'cover',
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
);