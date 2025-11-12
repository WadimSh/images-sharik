export const ProductImagesGrid = ({ 
  images,
  elements,
  handleImageSelect,
  isGrid
}) => (
  <div 
    className="images-grid"
    style={{ 
      flexDirection: isGrid > 600 ? 'row' : 'column',
      paddingTop: isGrid > 600 ? '8px' : '0px',
      paddingLeft: isGrid > 600 ? '8px' : '0px',
    }}
  >
    {images.map((img, index) => {
      const isActive = elements.some(el => 
        el.type === 'image' && el.image === img && el.isProduct
      );
      
      return (
        <div 
          key={index}
          className={`image-item ${isActive ? 'active' : ''}`}
          onClick={() => handleImageSelect(img, index)}
        >
          <img 
            src={img} 
            alt={`Вариант ${index + 1}`}
            className="product-image"
          />
        </div>
      )
    })}
  </div>
)