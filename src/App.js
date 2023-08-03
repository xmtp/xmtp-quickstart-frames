import "./App.css";
import Home from "./components/Home";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum-all";

function App() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "f0b977d0-b712-49f1-af89-2a24c47674da",
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <Home />
    </DynamicContextProvider>
  );
}

export default App;
