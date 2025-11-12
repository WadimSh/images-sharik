import { useMemo } from "react";

export const CollagePreview = ({ 
  initialElements,
  onItemClick,
  isGrid
}) => {
  const selectedItems = useMemo(() => {
    return initialElements
      .filter(element => element.type === 'image' && element.image)
      .map(element => {
        const codeElement = initialElements.find(el => 
          el.type === 'text' &&
          el.position.x === element.position.x + (element.width - 128)/2 &&
          el.position.y === element.position.y + element.height - 38
        );

        return {
          imageUrl: element.image,
          productCode: codeElement?.text || '',
          imageId: element.id,
          codeId: codeElement?.id,
          imagePosition: element.position,
          codePosition: codeElement?.position,
          imageWidth: element.width,
          imageHeight: element.height,
          originalWidth: element.originalWidth,
          originalHeight: element.originalHeight,
          fontSize: codeElement?.fontSize,
          textColor: codeElement?.color,
          fontFamily: codeElement?.fontFamily
        };
      });
  }, [initialElements]);

  return (
    <div 
      className="collage-preview-grid"
      style={{ 
      flexDirection: isGrid > 600 ? 'row' : 'column',
      paddingTop: isGrid > 600 ? '8px' : '0px',
      paddingLeft: isGrid > 600 ? '8px' : '0px',
    }}
    >
      {selectedItems.map((item) => {
                
        return (
          <div
            key={`preview-${item.imageUrl}`}
            className='preview-item'
            onClick={() => onItemClick(item)}
          >
            <div className="image-wrapper">
              <img
                src={item.imageUrl}
                alt={`Товар ${item.productCode}`}
                className="preview-image"
              />
              <div className="code-overlay">
                {item.productCode}
              </div>
            </div>
            
          </div>
        );
      })}
    </div>
  );
};

  