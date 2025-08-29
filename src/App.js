import Views from "./views/Views";
import { MarketplaceProvider } from "./contexts/contextMarketplace";
import { LanguageProvider } from "./contexts/contextLanguage";
import { AuthProvider } from "./contexts/AuthContext";
import { RecentImagesProvider } from "./contexts/contextRecentImages";

function App() {
  
  return (
    <LanguageProvider>
      <MarketplaceProvider>
        <AuthProvider>
          <RecentImagesProvider>
            <Views />
          </RecentImagesProvider>
        </AuthProvider>
      </MarketplaceProvider>
    </LanguageProvider>
  );
}

export default App;
