import React from 'react';

const ItemsGrid = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="items-grid-container">
      <div className="items-grid">
        {items.map((item, index) => (
          <div key={index} className="item-card">
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