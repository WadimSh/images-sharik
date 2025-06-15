import Views from "./views/Views";
import { MarketplaceProvider } from "./context/contextMarketplace";
import { LanguageProvider } from "./context/contextLanguage";

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
