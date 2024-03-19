"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const ListConversations = ({
  searchTerm,
  client,
  selectConversation,
  onConversationFound,
  isPWA = false,
  isFullScreen = false,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const styles = {
    conversationListItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      margin: "0px",
      border: "0px",
      borderBottom: "1px solid #e0e0e0",
      cursor: "pointer",
      backgroundColor: "#f0f0f0",

      transition: "background-color 0.3s ease",
      padding: isPWA == true ? "15px" : "10px",
    },
    avatarImage: {
      // New style for the avatar image
      width: "40px", // Adjust the size as needed
      height: "40px", // Adjust the size as needed
      borderRadius: "50%", // Makes the image circular
      marginRight: "10px", // Adds some space between the image and the text
    },
    conversationDetails: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      width: "75%",
      marginLeft: isPWA == true ? "15px" : "10px",
      overflow: "hidden",
    },
    conversationName: {
      fontSize: isPWA == true ? "15px" : "16px",
      fontWeight: "bold",
    },
    messagePreview: {
      fontSize: isPWA == true ? "12px" : "12px",
      color: "#666",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    conversationTimestamp: {
      fontSize: isPWA == true ? "10px" : "10px",
      color: "#999",
      width: "25%",
      textAlign: "right",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
  };

  useEffect(() => {
    let isMounted = true;
    let stream;
    const fetchAndStreamConversations = async () => {
      setLoading(true);
      const allConversations = await client.conversations.list();
      // Assuming you have a method to fetch the last message for a conversation

      const sortedConversations = allConversations.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      if (isMounted) {
        setConversations(sortedConversations);
      }
      setLoading(false);
      stream = await client.conversations.stream();
      for await (const conversation of stream) {
        console.log(
          `New conversation started with ${conversation.peerAddress}`,
        );
        if (isMounted) {
          setConversations((prevConversations) => {
            const newConversations = [...prevConversations, conversation];
            return newConversations.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            );
          });
        }

        //break;
      }
    };

    fetchAndStreamConversations();

    return () => {
      isMounted = false;
      if (stream) {
        stream.return();
      }
    };
  }, []);
  const [lastMessages, setLastMessages] = useState([]); // Parallel array for last messages

  useEffect(() => {
    const fetchLastMessages = async () => {
      try {
        const messages = [];
        console.log("conversations fetched", conversations.length);
        if (conversations.length > 100) {
          console.warn(
            "Notice: This app is not optimized for performance with a high number of conversations. For a better experience, try with wallets that have fewer conversations.",
          );
        }
        for (const conversation of conversations) {
          const conversationMessages = await conversation.messages();
          const content =
            conversationMessages[conversationMessages.length - 1]?.content;
          console.log(content);
          messages.push(
            conversationMessages[conversationMessages.length - 1]?.content,
          );
        }
        console.log("setLastMessages updated", messages.length);
        setLastMessages(messages);
      } catch (error) {
        console.error("Failed to fetch last messages:", error);
      }
    };

    if (conversations.length > 0) {
      fetchLastMessages();
    }
  }, [conversations]);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/dm\/(0x[a-fA-F0-9]{40})/); // Adjust regex as needed
    if (match) {
      const address = match[1];
      const conversationToSelect = conversations.find(
        (conv) => conv.peerAddress === address,
      );
      if (conversationToSelect) {
        selectConversation(conversationToSelect);
        setSelectedConversation(conversationToSelect?.peerAddress);
        navigate("", { replace: true });
      } else {
        console.log("No conversation found with address:", address);
      }
    } else if (conversations.length > 0 && isFullScreen) {
      // If no deep linking match, select the first conversation
      selectConversation(conversations[0]);
      setSelectedConversation(conversations[0]?.peerAddress);
    }
  }, [conversations, selectConversation]);

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation?.peerAddress
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      conversation?.peerAddress !== client.address,
  );

  useEffect(() => {
    if (filteredConversations.length > 0) {
      onConversationFound(true);
    }
  }, [filteredConversations, onConversationFound]);
  return (
    <>
      {loading ? (
        <div style={{ padding: "20px", fontSize: "12px", textAlign: "center" }}>
          Loading conversations...
        </div>
      ) : selectedConversation === null && conversations.length === 0 ? (
        <div style={{ padding: "20px", fontSize: "12px", textAlign: "center" }}>
          No conversations found. Use the input above to start a new one.
        </div>
      ) : (
        filteredConversations.map((conversation, index) => (
          <li
            key={index}
            style={{
              ...styles.conversationListItem,
              backgroundColor:
                selectedConversation === conversation.peerAddress
                  ? "#d0e0f0"
                  : styles.conversationListItem.backgroundColor,
            }}
            onClick={() => {
              selectConversation(conversation);
              setSelectedConversation(conversation.peerAddress);
            }}>
            {/*<img src="/avatar.png" alt="Avatar" style={styles.avatarImage} />*/}
            <div style={styles.conversationDetails}>
              <span style={styles.conversationName}>
                {conversation.peerAddress.substring(0, 7) +
                  "..." +
                  conversation.peerAddress.substring(
                    conversation.peerAddress.length - 5,
                  )}
              </span>
              <span style={styles.messagePreview}>
                {lastMessages[index] ? lastMessages[index] : "..."}
              </span>
            </div>
            <div style={styles.conversationTimestamp}>
              {getRelativeTimeLabel(conversation.createdAt)}
            </div>
          </li>
        ))
      )}
    </>
  );
};

const getRelativeTimeLabel = (dateString) => {
  const diff = new Date() - new Date(dateString);
  const diffMinutes = Math.floor(diff / 1000 / 60);
  const diffHours = Math.floor(diff / 1000 / 60 / 60);
  const diffDays = Math.floor(diff / 1000 / 60 / 60 / 24);
  const diffWeeks = Math.floor(diff / 1000 / 60 / 60 / 24 / 7);

  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
};
