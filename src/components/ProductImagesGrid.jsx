export const ProductImagesGrid = ({ 
  images,
  elements,
  handleImageSelect
}) => (
  <div className="images-grid">
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