import { createContext, useContext, useState } from 'react';

export const MarketplaceContext = createContext();

export const MarketplaceProvider = ({ children }) => {
  const [marketplace, setMarketplace] = useState('WB'); // Default value is WB

  const toggleMarketplace = () => {
    setMarketplace(prev => prev === 'WB' ? 'OZ' : 'WB');
  };

  return (
    <MarketplaceContext.Provider value={{ marketplace, toggleMarketplace }}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}; 