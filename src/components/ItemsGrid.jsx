import { useNavigate } from 'react-router-dom';


const ItemsGrid = ({ items }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  const handleItemClick = (itemId) => {
    navigate(`/template/${itemId}`);
  };

  return (
    <div className="items-grid-container">
      <div className="items-grid">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="item-card"
            onClick={() => handleItemClick(item)}
            role="button"
            tabIndex={0}
          >
            <div className="item-content">
              <span className="item-article">{item}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ItemsGrid;