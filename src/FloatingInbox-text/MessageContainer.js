import React, { useState, useRef, useEffect } from "react";
import { MessageInput } from "./MessageInput";
import { MessageItem } from "./MessageItem";

export const MessageContainer = ({
  conversation,
  client,
  searchTerm,
  isContained = false,
  selectConversation,
  isConsent = false,
  isFullScreen = false,
}) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [showPopup, setShowPopup] = useState(
    conversation?.consentState === "unknown",
  );

  const styles = {
    loadingText: {
      textAlign: "center",
      fontSize: "12px",
    },
    messagesContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "100%",
    },
    peerAddressContainer: {
      textAlign: "right",
      width: "100%",
      borderBottom: "1px solid lightgrey",
      padding: "0px",
      margin: "2px",
    },
    peerAddressContainerLabel: {
      margin: "0px",
      fontSize: "10px",
      padding: "5px",
    },
    peerAddressContainerhref: {
      textDecoration: "none",
    },
    messagesList: {
      paddingLeft: "5px",
      paddingRight: "5px",
      margin: "0px",
      alignItems: "flex-start",
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    },
    popup: {
      width: "100%",
      padding: "10px",
      backgroundColor: "rgba(211, 211, 211, 0.3)", // lightgrey with transparency
    },
    popupInner: {
      display: "flex",
      justifyContent: "space-evenly",
      width: "100%",
    },
    popupButton: {
      borderRadius: "12px", // Rounded corners
      paddingLeft: "10px", // Some padding on the left
      paddingRight: "10px", // Some padding on the right
    },
    acceptButton: {
      backgroundColor: "blue", // Blue background
      color: "white", // White text
    },
    blockButton: {
      backgroundColor: "red", // Red background
      color: "white", // White text
    },
    popupTitle: {
      textAlign: "center",
    },
  };

  const updateMessages = (prevMessages, newMessage) => {
    const doesMessageExist = prevMessages.some(
      (existingMessage) => existingMessage.id === newMessage.id,
    );

    if (!doesMessageExist) {
      return [...prevMessages, newMessage];
    }

    return prevMessages;
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (conversation && conversation.peerAddress) {
          setIsLoading(true);

          const initialMessages = await conversation?.messages();

          let updatedMessages = [];
          initialMessages.forEach((message) => {
            updatedMessages = updateMessages(updatedMessages, message);
          });

          setMessages(updatedMessages);
          setIsLoading(false);
        }
      } catch (e) {
        console.log(e);
      }
    };

    fetchMessages();
  }, [conversation]);

  // Function to handle the acceptance of a contact
  const handleAccept = async () => {
    // Allow the contact
    await client.contacts.allow([conversation.peerAddress]);
    // Hide the popup
    setShowPopup(false);
    // Refresh the consent list
    await client.contacts.refreshConsentList();
    // Log the acceptance
  };

  // Function to handle the blocking of a contact
  const handleBlock = async () => {
    // Block the contact
    await client.contacts.deny([conversation.peerAddress]);
    // Hide the popup
    setShowPopup(false);
    // Refresh the consent list
    await client.contacts.refreshConsentList();
    // Log the blocking
  };
  const startMessageStream = async () => {
    try {
      let stream = await conversation?.streamMessages();
      for await (const message of stream) {
        setMessages((prevMessages) => {
          return updateMessages(prevMessages, message);
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (conversation && conversation.peerAddress) {
      startMessageStream();
    }
    return () => {};
  }, [conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let count = 0;
    if (!isContained) {
      const interval = setInterval(() => {
        if (count < 5) {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          count++;
        } else {
          clearInterval(interval);
        }
      }, 1000); // Repeat every second, up to 5 times
      return () => clearInterval(interval);
    }
  }, [messages, isContained]);

  const handleSendMessage = async (newMessage) => {
    if (!newMessage.trim()) {
      alert("empty message");
      return;
    }
    if (conversation && conversation.peerAddress) {
      await conversation.send(newMessage);
    } else if (conversation) {
      const conv = await client.conversations.newConversation(searchTerm);
      await conv.send(newMessage);
      selectConversation(conv);
    }
  };

  return (
    <div style={styles.messagesContainer}>
      {isLoading ? (
        <div style={styles.loadingText}>Loading messages...</div>
      ) : (
        <>
          {isFullScreen && (
            <div style={styles.peerAddressContainer}>
              <div style={styles.peerAddressContainerLabel}>
                To: {conversation.peerAddress}
                <div
                  onClick={() => {
                    window.open(
                      window.location.href + "dm/" + conversation.peerAddress,
                      "_blank",
                    );
                  }}
                  style={{ display: "inline", cursor: "pointer" }}>
                  {" "}
                  🔗
                </div>
                <div
                  onClick={() => {
                    navigator.clipboard.writeText(conversation.peerAddress);
                    alert("Address copied to clipboard");
                  }}
                  style={{ display: "inline", cursor: "pointer" }}>
                  {" "}
                  📋
                </div>
              </div>
            </div>
          )}
          <ul style={styles.messagesList}>
            {messages.slice().map((message) => {
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  senderAddress={message.senderAddress}
                  client={client}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </ul>
          {isConsent && showPopup ? (
            <div style={styles.popup}>
              <h4 style={styles.popupTitle}>Do you trust this contact?</h4>
              <div style={styles.popupInner}>
                <button
                  style={{ ...styles.popupButton, ...styles.acceptButton }}
                  onClick={handleAccept}>
                  Accept
                </button>
                <button
                  style={{ ...styles.popupButton, ...styles.blockButton }}
                  onClick={handleBlock}>
                  Block
                </button>
              </div>
            </div>
          ) : null}
          <MessageInput
            onSendMessage={(msg) => {
              handleSendMessage(msg);
            }}
          />
        </>
      )}
    </div>
  );
};
