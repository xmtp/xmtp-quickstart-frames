import styled from "styled-components";
import React, { useState } from "react";

const NewMessageContainer = styled.div`
  display: flex;
  align-items: center;
  padding-left: 10px;
  padding-right: 10px;
  flex-wrap: wrap; // Add this line
`;

const MessageInputField = styled.input`
  flex-grow: 1;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const SendButton = styled.button`
  padding: 5px 10px;
  margin-left: 5px;
  border: 1px solid #ccc;
  cursor: pointer;
  border-radius: 5px;
  display: flex;
  align-items: center;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;

const ReplyingTo = styled.div`
  font-size: 10px;
  color: grey;
  padding-bottom: 5px;
  word-break: break-all;
  background-color: lightblue;
  width: 100%; // Takes 100% of the parent width, will force a new line
`;

export const MessageInput = ({ onSendMessage, replyingToMessage }) => {
  const [newMessage, setNewMessage] = useState("");

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleInputChange = (event) => {
    if (event.key === "Enter") {
      onSendMessage(newMessage);
      setNewMessage("");
    } else {
      setNewMessage(event.target.value);
    }
  };

  return (
    <NewMessageContainer>
      <MessageInputField
        type="text"
        value={newMessage}
        onKeyPress={handleInputChange}
        onChange={handleInputChange}
        placeholder="Type your message..."
      />
      <SendButton
        onClick={() => {
          onSendMessage(newMessage);
          setNewMessage("");
        }}>
        Send
      </SendButton>
    </NewMessageContainer>
  );
};
