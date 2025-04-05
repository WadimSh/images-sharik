import { useNavigate } from 'react-router-dom';

const ItemsGrid = ({ items }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const PreviewDesign = ({ elements }) => {
    return (
      <div className="preview-container">
        {elements.map((element) => {
          const style = {
            left: `${(element.position.x / 450) * 100}%`,
            top: `${(element.position.y / 600) * 100}%`,
            width: `${(element.width / 450) * 100}%`,
            height: `${(element.height / 600) * 100}%`,
            transform: `rotate(${element.rotation}deg)`,
            position: 'absolute'
          };
  
          switch (element.type) {
            case 'image':
              return <img key={element.id} src={element.image} alt="preview" 
                       style={{
                        ...style,
                        objectFit: 'cover',
                      }} className="preview-element" />;
            case 'text':
              return (
                <div key={element.id} style={{
                  ...style, 
                  fontSize: `${(element.fontSize || 24) * 0.61}px`,
                  fontFamily: element.fontFamily,
                  color: element.color,
                  whiteSpace: 'nowrap'
                }} className="preview-text">
                  {element.text}
                </div>
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
  };

  const handleItemClick = (itemId) => {
    navigate(`/template/${itemId}`);
  };

  return (
    <div className="items-grid-container">
      <div className="items-grid">
        {items.map((item, index) => {
          const designData = sessionStorage.getItem(`design-${item}`);
          const elements = designData ? JSON.parse(designData) : null;

          return (
            <div 
              key={index} 
              className="item-card"
              onClick={() => handleItemClick(item)}
              role="button"
              tabIndex={0}
            >
              <div className="item-content">
                {elements ? (
                  <PreviewDesign elements={elements} />
                ) : (
                  <span className="item-article">{item}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ItemsGrid;