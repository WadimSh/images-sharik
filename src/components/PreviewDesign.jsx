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
            <span key={element.id} style={{
              ...style, 
              fontSize: `${(element.fontSize || 24) * 0.61}px`,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight || 'normal',
              fontStyle: element.fontStyle || 'normal',
              color: element.color,
              whiteSpace: 'nowrap'
            }} className="preview-text">
              {element.text}
            </span>
          );
        case 'shape':
          return <div key={element.id} 
                   style={{...style, backgroundColor: element.color}} 
                   className="preview-shape" />;
        default:
          return null;
      }
    })}
  </div>
);