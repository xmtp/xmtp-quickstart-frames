import React, { useState, useEffect } from "react";
import { Client } from "@xmtp/react-sdk";
import { ethers } from "ethers";

import styled, { keyframes } from "styled-components";
import { getEnv, loadKeys, storeKeys, wipeKeys } from "./helpers";
import { ConversationContainer } from "./ConversationContainer";

export function UInbox({ wallet, env }) {
  const initialIsOpen =
    localStorage.getItem("isWidgetOpen") === "true" || false;
  const initialIsOnNetwork =
    localStorage.getItem("isOnNetwork") === "true" || false;
  const initialIsConnected =
    (localStorage.getItem("isConnected") && wallet === "true") || false;

  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isOnNetwork, setIsOnNetwork] = useState(initialIsOnNetwork);
  const [isConnected, setIsConnected] = useState(initialIsConnected);
  const [xmtpClient, setXmtpClient] = useState();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [signer, setSigner] = useState();

  useEffect(() => {
    if (wallet) {
      setSigner(wallet);
      setIsConnected(true);
    }
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem("isOnNetwork", isOnNetwork.toString());
    localStorage.setItem("isWidgetOpen", isOpen.toString());
    localStorage.setItem("isConnected", isConnected.toString());
  }, [isOpen, isConnected, isOnNetwork]);

  useEffect(() => {
    if (signer && isOnNetwork) {
      initXmtpWithKeys();
    }
  }, [signer, isOnNetwork]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.enable();
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setSigner(provider.getSigner());
        setIsConnected(true);
      } catch (error) {
        console.error("User rejected request", error);
      }
    } else {
      console.error("Metamask not found");
    }
  };

  const getAddress = async (signer) => {
    try {
      return await signer?.getAddress();
    } catch (e) {
      console.log(e);
      console.log("entra3");
    }
  };

  const initXmtpWithKeys = async function () {
    // Get address from the signer
    if (!signer) {
      handleLogout();
      return;
    }
    console.log("entra7");
    let address = await getAddress(signer);
    let keys = loadKeys(address);
    const clientOptions = {
      env: env ? env : getEnv(),
    };
    if (!keys) {
      keys = await Client.getKeys(signer, {
        ...clientOptions,
        // we don't need to publish the contact here since it
        // will happen when we create the client later
        skipContactPublishing: true,
        // we can skip persistence on the keystore for this short-lived
        // instance
        persistConversations: false,
      });
      storeKeys(address, keys);
    }
    const xmtp = await Client.create(null, {
      ...clientOptions,
      privateKeyOverride: keys,
    });

    setIsOnNetwork(!!xmtp.address);
    setXmtpClient(xmtp);
  };

  const openWidget = () => {
    setIsOpen(true);
  };

  const closeWidget = () => {
    setIsOpen(false);
  };
  // Define uinbox object for global access
  window.uinbox = {
    open: openWidget,
    close: closeWidget,
  };
  // Logout function to reset all states and clear local storage
  const handleLogout = async () => {
    setIsConnected(false);
    setIsOnNetwork(false);

    const address = await getAddress(signer);
    wipeKeys(address);
    setSigner(null);
    setSelectedConversation(null);
    localStorage.removeItem("isOnNetwork");
    localStorage.removeItem("isConnected");
    // Optionally, you can also reset other states and clear other local storage items
  };
  return (
    <>
      <FloatingLogo
        onClick={isOpen ? closeWidget : openWidget}
        className={isOpen ? "spin-clockwise" : "spin-counter-clockwise"}>
        <SVGLogo />
      </FloatingLogo>
      {isOpen && (
        <UButton className={isOnNetwork ? "expanded" : ""}>
          {isConnected && <LogoutBtn onClick={handleLogout}>Logout</LogoutBtn>}
          {isConnected && isOnNetwork && (
            <WidgetHeader>
              <ConversationHeader>
                {isOnNetwork && selectedConversation && (
                  <BackButton
                    onClick={() => {
                      setSelectedConversation(null);
                    }}>
                    ←
                  </BackButton>
                )}
                <h4>Conversations</h4>
              </ConversationHeader>
            </WidgetHeader>
          )}
          <WidgetContent>
            {!isConnected && (
              <XmtpContainer>
                <BtnXmtp onClick={connectWallet}>Connect Wallet</BtnXmtp>
              </XmtpContainer>
            )}
            {isConnected && !isOnNetwork && (
              <XmtpContainer>
                <BtnXmtp onClick={initXmtpWithKeys}>Connect to XMTP</BtnXmtp>
              </XmtpContainer>
            )}
            {isConnected && isOnNetwork && xmtpClient && (
              <ConversationContainer
                client={xmtpClient}
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
              />
            )}
          </WidgetContent>
          <WidgetFooter>
            <Powered>
              Powered by <PoweredLogo fill="#fc4f37" width="12px" /> XMTP{" "}
            </Powered>
          </WidgetFooter>
        </UButton>
      )}
    </>
  );
}

const spinCounterClockwise = keyframes`
  0% {
    transform: rotate(360deg);
  }
  100% {
    transform: rotate(0deg);
}`;

const spinClockwise = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
}`;

const FloatingLogo = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  justify-content: center;
  box-shadow: 0 2px 10px #ccc;
  cursor: pointer;
  transition: transform 0.3s ease;
  padding: 5px;

  :active {
    transform: scale(0.9);
  }

  :active {
    transform: scale(0.95);
  }

  :hover {
    transform: scale(1.05); /* This makes it grow a little (5%) when hovered */
  }

  :hover path {
    transform: rotate(360deg); /* 360-degree spin */
    fill: #ef4444; /* new color (red in this example) */
  }

  &.spin-clockwise path {
    animation: ${spinClockwise} 0.5s linear;
    transform-origin: center;
  }

  &.spin-counter-clockwise path {
    animation: ${spinCounterClockwise} 0.5s linear;
    transform-origin: center;
  }
`;

const UButton = styled.div`
  position: fixed;
  bottom: 70px;
  right: 20px;
  width: 300px;
  height: 400px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.expanded {
    height: 400px;
  }
`;
const WidgetHeader = styled.div`
  padding: 5px;
  h4 {
    margin: 5px;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const WidgetContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
`;

const BtnXmtp = styled.button`
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid grey;
  padding: 10px;
  border-radius: 5px;
`;

const WidgetFooter = styled.div`
  padding: 5px;
  font-size: 12px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const XmtpContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const LogoutBtn = styled.button`
  position: absolute;
  top: 10px;
  left: 5px;
  background: transparent;
  border: none;
  font-size: 10px;
  cursor: pointer;
`;

const ConversationHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  width: auto;
  margin: 0 auto;
`;

const BackButton = styled.button`
  border: 0px;
  background: transparent;
  cursor: pointer;
`;
function SVGLogo({ width, fill }) {
  return (
    <svg
      viewBox="0 0 462 462"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width }}>
      <path
        fill={fill}
        d="M1 231C1 103.422 104.422 0 232 0C359.495 0 458 101.5 461 230C461 271 447 305.5 412 338C382.424 365.464 332 369.5 295.003 349C268.597 333.767 248.246 301.326 231 277.5L199 326.5H130L195 229.997L132 135H203L231.5 184L259.5 135H331L266 230C266 230 297 277.5 314 296C331 314.5 362 315 382 295C403.989 273.011 408.912 255.502 409 230C409.343 131.294 330.941 52 232 52C133.141 52 53 132.141 53 231C53 329.859 133.141 410 232 410C245.674 410 258.781 408.851 271.5 406L283.5 456.5C265.401 460.558 249.778 462 232 462C104.422 462 1 358.578 1 231Z"
      />
    </svg>
  );
}
const Powered = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between; // Add this line
  width: 40%;
`;

const PoweredLogo = styled(SVGLogo)`
  width: ${(props) => props.width || "50px"};
  fill: ${(props) => props.fillColor || "#000"};
`;
