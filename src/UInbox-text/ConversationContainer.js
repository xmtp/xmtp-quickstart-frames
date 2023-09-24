import React, { useState, useEffect } from "react";
import { MessageContainer } from "./MessageContainer"; // Import MessageContainer
import axios from "axios";
import styled from "styled-components";

export const ConversationContainer = ({
  client,
  selectedConversation,
  setSelectedConversation,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [peerAddress, setPeerAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingResolve, setLoadingResolve] = useState(false);

  const [canMessage, setCanMessage] = useState(false);
  const [conversations, setConversations] = useState([]);
  const isValidEthereumAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  useEffect(() => {
    let isMounted = true; // This flag is used to prevent state updates on an unmounted component
    let stream; // Define stream here

    const fetchAndStreamConversations = async () => {
      // Fetch the conversations
      setLoading(true);
      const allConversations = await client.conversations.list();

      const sortedConversations = allConversations.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      if (isMounted) {
        setConversations(sortedConversations);
      }
      setLoading(false);

      // Start the stream
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
        break;
      }
    };

    fetchAndStreamConversations();

    return () => {
      isMounted = false; // Prevent state updates after the component has unmounted
      if (stream) {
        stream.return(); // End the stream when the component unmounts
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup runs on unmount

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation?.peerAddress
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      conversation?.peerAddress !== client.address,
  );
  const selectConversation = async (conversation) => {
    console.log(conversation);
    setSelectedConversation(conversation);
  };

  const getRelativeTimeLabel = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diff = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diff / 1000);
    const diffMinutes = Math.floor(diff / 1000 / 60);
    const diffHours = Math.floor(diff / 1000 / 60 / 60);
    const diffDays = Math.floor(diff / 1000 / 60 / 60 / 24);
    const diffWeeks = Math.floor(diff / 1000 / 60 / 60 / 24 / 7);

    if (diffSeconds < 60) {
      return "now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else {
      return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    }
  };
  const handleSearchChange = async (e) => {
    setSearchTerm(e.target.value);
    const addressInput = e.target.value;

    // Check if it's already a valid Ethereum address first
    if (isValidEthereumAddress(addressInput)) {
      processEthereumAddress(addressInput);
      return;
    }
    setLoadingResolve(true); // Set loading to true here

    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `https://api.everyname.xyz/forward?domain=${addressInput}`,
        headers: {
          Accept: "application/json",
          "api-key": process.env.REACT_APP_EVERYNAME_KEY,
        },
      };

      const response = await axios.request(config);
      const resolvedAddress = response.data.address; // Assuming the API returns the address with key "address"

      if (resolvedAddress && isValidEthereumAddress(resolvedAddress)) {
        processEthereumAddress(resolvedAddress);
        setSearchTerm(resolvedAddress); // <-- Add this line
      } else {
        setMessage("Invalid Ethereum address");
        setPeerAddress(null);
        setCanMessage(false);
      }
    } catch (error) {
      console.log(error);
      setMessage("Error resolving address");
    } finally {
      setLoadingResolve(false); // Set loading to false whether it's successful or there's an error
    }
  };

  const processEthereumAddress = async (address) => {
    setPeerAddress(address);
    if (address === client.address) {
      setMessage("No self messaging allowed");
      setCanMessage(false);
    } else {
      const canMessageStatus = await client?.canMessage(address);
      if (canMessageStatus) {
        setPeerAddress(address);
        setCanMessage(true);
        setMessage("Address is on the network ✅");
      } else {
        setCanMessage(false);
        setMessage("Address is not on the network ❌");
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <Conversations>
      {!selectedConversation && (
        <ConversationList>
          <PeerAddressInput
            type="text"
            placeholder="Enter a 0x wallet, ENS, or UNS address"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {loadingResolve && searchTerm && <small>Resolving address...</small>}{" "}
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation, index) => (
              <ConversationListItem
                key={index}
                onClick={() => {
                  selectConversation(conversation);
                }}>
                <ConversationDetails>
                  <ConversationName>
                    {conversation.peerAddress.substring(0, 6) +
                      "..." +
                      conversation.peerAddress.substring(
                        conversation.peerAddress.length - 4,
                      )}
                  </ConversationName>
                  <MessagePreview>...</MessagePreview>
                </ConversationDetails>
                <ConversationTimestamp>
                  {getRelativeTimeLabel(conversation.createdAt)}
                </ConversationTimestamp>
              </ConversationListItem>
            ))
          ) : (
            <>
              {message && <small>{message}</small>}
              {peerAddress && canMessage && (
                <CreateNewButton
                  onClick={() => {
                    setSelectedConversation({ messages: [] });
                  }}>
                  Create new conversation
                </CreateNewButton>
              )}
            </>
          )}
        </ConversationList>
      )}
      {selectedConversation && (
        <MessageContainer
          client={client}
          conversation={selectedConversation}
          searchTerm={searchTerm}
          selectConversation={selectConversation}
        />
      )}
    </Conversations>
  );
};

const Conversations = styled.div`
  height: 100% !important;
`;

const ConversationList = styled.ul`
  overflow-y: auto;
  padding: 0px;
  margin: 0;
  list-style: none;
  overflow-y: scroll;
`;

const ConversationListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  background-color: #f0f0f0;
  padding: 10px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: lightblue;
  }
`;

const ConversationDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 75%;
  margin-left: 10px;
  overflow: hidden;
`;

const ConversationName = styled.span`
  font-size: 16px;
  font-weight: bold;
`;

const MessagePreview = styled.span`
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConversationTimestamp = styled.div`
  font-size: 12px;
  color: #999;
  width: 25%;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
`;

const CreateNewButton = styled.button`
  border: 1px;
  padding: 5px;
  border-radius: 5px;
  margin-top: 10px;
`;

const PeerAddressInput = styled.input`
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  border: 0px solid #ccc;
`;
