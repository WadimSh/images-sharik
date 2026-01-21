import Views from "./views/Views";
import { MarketplaceProvider } from "./contexts/contextMarketplace";
import { LanguageProvider } from "./contexts/contextLanguage";
import { AuthProvider } from "./contexts/AuthContext";
import { RecentImagesProvider } from "./contexts/contextRecentImages";
import { UploadProvider } from './contexts/UploadContext';
import UploadProgress from './components/UploadProgress';

function App() {
  
  return (
    
      <LanguageProvider>
        <MarketplaceProvider>
          <UploadProvider>
            <AuthProvider>
              <RecentImagesProvider>
                <Views />
              </RecentImagesProvider>
            </AuthProvider>
            <UploadProgress />
          </UploadProvider>
        </MarketplaceProvider>
      </LanguageProvider>
    
    
  );
}

export default App;
