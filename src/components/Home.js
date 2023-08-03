import { Client } from "@xmtp/xmtp-js";

import React, { useEffect, useState, useRef } from "react";
import Chat from "./Chat";
import styles from "./Home.module.css";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";

const PEER_ADDRESS = "0x937C0d4a6294cdfa575de17382c7076b579DC176";

export default function Home() {
  const [messages, setMessages] = useState(null);
  const convRef = useRef(null);
  const clientRef = useRef(null);
  const [signer, setSigner] = useState(null);

  const { primaryWallet } = useDynamicContext();

  const isConnected = !!primaryWallet;

  const getAndSetSigner = async () => {
    const signer = await primaryWallet.connector.getSigner();
    setSigner(signer);
  };

  useEffect(() => {
    if (primaryWallet && !signer) {
      getAndSetSigner();
    } else if (!primaryWallet && signer) {
      setSigner(null);
    }
  }, [primaryWallet]);

  const [isOnNetwork, setIsOnNetwork] = useState(false);

  // Function to load the existing messages in a conversation
  const newConversation = async function (xmtp_client, addressTo) {
    //Creates a new conversation with the address
    if (await xmtp_client?.canMessage(PEER_ADDRESS)) {
      const conversation = await xmtp_client.conversations.newConversation(
        addressTo
      );
      convRef.current = conversation;
      //Loads the messages of the conversation
      const messages = await conversation.messages();
      setMessages(messages);
    } else {
      console.log("cant message because is not on the network.");
      //cant message because is not on the network.
    }
  };

  // Function to initialize the XMTP client
  const initXmtp = async function () {
    // Create the XMTP client
    const xmtp = await Client.create(signer, { env: "production" });
    //Create or load conversation with Gm bot
    newConversation(xmtp, PEER_ADDRESS);
    // Set the XMTP client in state for later use
    setIsOnNetwork(!!xmtp.address);
    //Set the client in the ref
    clientRef.current = xmtp;
  };

  useEffect(() => {
    if (isOnNetwork && convRef.current) {
      // Function to stream new messages in the conversation
      const streamMessages = async () => {
        const newStream = await convRef.current.streamMessages();
        for await (const msg of newStream) {
          const exists = messages.find((m) => m.id === msg.id);
          if (!exists) {
            setMessages((prevMessages) => {
              const msgsnew = [...prevMessages, msg];
              return msgsnew;
            });
          }
        }
      };
      streamMessages();
    }
  }, [messages, isOnNetwork]);

  return (
    <div className={styles.Home}>
      {/* Display the ConnectWallet component if not connected */}
      {!isConnected && (
        <div className={styles.dynamic}>
          <DynamicWidget />
        </div>
      )}
      {/* Display XMTP connection options if connected but not initialized */}
      {isConnected && !isOnNetwork && (
        <div className={styles.xmtp}>
          <DynamicWidget />
          <button onClick={initXmtp} className={styles.btnXmtp}>
            Connect to XMTP
          </button>
        </div>
      )}
      {/* Render the Chat component if connected, initialized, and messages exist */}
      {isConnected && isOnNetwork && messages && (
        <Chat
          client={clientRef.current}
          conversation={convRef.current}
          messageHistory={messages}
        />
      )}
    </div>
  );
}
