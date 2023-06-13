import "./App.css";
import Home from "./components/Home";
import { ThirdwebProvider } from "@thirdweb-dev/react";

function App() {
  return (
    <ThirdwebProvider activeChain="goerli">
      <Home />
    </ThirdwebProvider>
  );
}

export default App;
