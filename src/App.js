import Views from "./views/Views";
import { MarketplaceProvider } from "./contexts/contextMarketplace";
import { LanguageProvider } from "./contexts/contextLanguage";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  
  return (
    <LanguageProvider>
      <MarketplaceProvider>
        <AuthProvider>
          <Views />
        </AuthProvider>
      </MarketplaceProvider>
    </LanguageProvider>
  );
}

export default App;
