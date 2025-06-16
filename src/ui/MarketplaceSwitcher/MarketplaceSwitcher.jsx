import React from 'react';
import { useMarketplace } from '../../contexts/contextMarketplace';
import './MarketplaceSwitcher.css';

const MarketplaceSwitcher = () => {
  const { marketplace, toggleMarketplace } = useMarketplace();

  return (
    <div className="switcher-container">
      <div 
        className={`option ${marketplace === 'WB' ? 'active' : ''}`}
        onClick={() => marketplace !== 'WB' && toggleMarketplace()}
      >
        <span>WB</span>
      </div>
      
      <div 
        className={`option ${marketplace === 'OZ' ? 'active' : ''}`}
        onClick={() => marketplace !== 'OZ' && toggleMarketplace()}
      >
        <span>OZON</span>
      </div>
      
      <div className={`switch ${marketplace === 'WB' ? 'wb-active' : 'oz-active'}`}></div>
    </div>
  );
};

export default MarketplaceSwitcher;