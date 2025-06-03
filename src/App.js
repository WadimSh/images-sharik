import Views from "./views/Views";
import { MarketplaceProvider } from "./context/contextMarketplace";

function App() {
  return (
    <MarketplaceProvider>
      <Views />
    </MarketplaceProvider>
  );
}

export default App;
