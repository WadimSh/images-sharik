import { hexToRgba } from "../utils/hexToRgba";

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
          return <img key={element.id} src={element.image} alt="preview" 
                   style={{
                    ...style,
                    objectFit: 'cover',
                  }} className="preview-element" />;
        case 'element':
          return <img key={element.id} src={element.image} alt="preview" 
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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: element.textAlign?.horizontal || 'flex-start',
                    justifyContent: element.textAlign?.vertical || 'flex-start',
                    textAlign: element.textAlign?.horizontal || 'left',
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
        default:
          return null;
      }
    })}
  </div>
);