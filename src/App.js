import Views from "./views/Views";
import { MarketplaceProvider } from "./contexts/contextMarketplace";
import { LanguageProvider } from "./contexts/contextLanguage";

function App() {
  
  return (
    <LanguageProvider>
      <MarketplaceProvider>
        <Views />
      </MarketplaceProvider>
    </LanguageProvider>
  );
}

export default App;
