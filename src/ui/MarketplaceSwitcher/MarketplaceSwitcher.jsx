import React from 'react';
import { useMarketplace } from '../../contexts/contextMarketplace';
import './MarketplaceSwitcher.css';

const MarketplaceSwitcher = () => {
  const { marketplace, toggleMarketplace } = useMarketplace();

  const handleMarketplaceClick = (targetMarketplace) => {
    if (marketplace !== targetMarketplace) {
      toggleMarketplace(targetMarketplace);
    }
  };

  const getSwitchPosition = () => {
    switch (marketplace) {
      case 'WB': return 'wb-active';
      case 'OZ': return 'oz-active';
      case 'AM': return 'am-active';
      default: return 'wb-active';
    }
  };

  return (
    <div className="switcher-container">
      <div 
        className={`option ${marketplace === 'WB' ? 'active' : ''}`}
        onClick={() => handleMarketplaceClick('WB')}
      >
        <span>WB</span>
      </div>
      
      <div 
        className={`option ${marketplace === 'OZ' ? 'active' : ''}`}
        onClick={() => handleMarketplaceClick('OZ')}
      >
        <span>OZON</span>
      </div>
      
      <div 
        className={`option ${marketplace === 'AM' ? 'active' : ''}`}
        onClick={() => handleMarketplaceClick('AM')}
      >
        <span>AMAZON</span>
      </div>
      
      <div className={`switch ${getSwitchPosition()}`}></div>
    </div>
  );
};

export default MarketplaceSwitcher;