import React, { useState, useEffect } from "react";
import { UInbox } from "./UInbox-text";
import styled from "styled-components";
import { ethers } from "ethers";

const HomePageWrapper = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

const ButtonStyled = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 5px;
  margin-bottom: 2px;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.3s ease;

  color: "#333333";
  background-color: "#ededed";
  font-size: "12px";
`;

const InboxPage = () => {
  const [signer, setSigner] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false); // Add state for wallet connection

  const disconnectWallet = () => {
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("signerAddress");
    setSigner(null);
    setWalletConnected(false);
  };

  const getAddress = async (signer) => {
    try {
      return await signer?.getAddress();
    } catch (e) {
      console.log(e);
    }
  };
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        setSigner(signer);
        setWalletConnected(true);
        let address = await getAddress(signer);
        localStorage.setItem("walletConnected", JSON.stringify(true)); // Save connection status in local storage
        localStorage.setItem("signerAddress", JSON.stringify(address)); // Save signer address in local storage
      } catch (error) {
        console.error("User rejected request", error);
      }
    } else {
      console.error("Metamask not found");
    }
  };

  useEffect(() => {
    const storedWalletConnected = localStorage.getItem("walletConnected");
    const storedSignerAddress = JSON.parse(
      localStorage.getItem("signerAddress")
    );
    if (storedWalletConnected && storedSignerAddress) {
      setWalletConnected(JSON.parse(storedWalletConnected));
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      setSigner(signer);
    }
  }, []);

  return (
    <HomePageWrapper>
      <ButtonStyled
        className="home-button"
        style={{ marginLeft: 10 }}
        onClick={() => connectWallet()}
      >
        {walletConnected ? "Connected" : "Connect Wallet"}
      </ButtonStyled>
      {walletConnected && (
        <ButtonStyled
          className="home-button"
          style={{ marginLeft: 10 }}
          onClick={() => disconnectWallet()}
        >
          Logout
        </ButtonStyled>
      )}
      <h1>UInbox </h1>

      <section className="App-section">
        <ButtonStyled
          className="home-button"
          onClick={() => window.uinbox.open()}
        >
          Open
        </ButtonStyled>
        <ButtonStyled
          className="home-button"
          style={{ marginLeft: 10 }}
          onClick={() => window.uinbox.close()}
        >
          Close
        </ButtonStyled>
      </section>

      <UInbox env={process.env.REACT_APP_XMTP_ENV} wallet={signer} />
    </HomePageWrapper>
  );
};

export default InboxPage;
