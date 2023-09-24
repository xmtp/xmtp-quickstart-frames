import React from "react";
import styled from "styled-components";

const MessageItem = ({ message, senderAddress, client }) => {
  const renderMessage = (message) => {
    try {
      if (message?.content.length > 0) {
        return <RenderedMessage>{message?.content}</RenderedMessage>;
      }
    } catch {
      return message?.fallbackContent
        ? message?.fallbackContent
        : message?.contentFallback
        ? message?.contentFallback
        : "No fallback";
    }
  };

  const isSender = senderAddress === client?.address;

  const MessageComponent = isSender ? SenderMessage : ReceiverMessage;

  return (
    <MessageComponent key={message.id}>
      <MessageContent>
        {renderMessage(message)}
        <Footer>
          <TimeStamp>
            {`${new Date(message.sent).getHours()}:${String(
              new Date(message.sent).getMinutes(),
            ).padStart(2, "0")}`}
          </TimeStamp>
        </Footer>
      </MessageContent>
    </MessageComponent>
  );
};
export default MessageItem;

const RenderedMessage = styled.div`
  font-size: 12px;
  word-break: break-word;
  padding: 0px;
`;
const MessageContent = styled.div`
  background-color: lightblue;
  padding: 5px 10px;

  align-self: flex-start;
  text-align: left;
  display: inline-block;
  margin: 5px;
  padding: 5px 10px;
  border-radius: 5px;
  max-width: 80%;
  word-break: break-word;
  cursor: pointer;
  list-style: none;
`;

const SenderMessage = styled.li`
  align-self: flex-start;
  text-align: right;
  list-style: none;
`;

const ReceiverMessage = styled.li`
  align-self: flex-end;
  list-style: none;
  text-align: right;
`;

// Styled-components
const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const TimeStamp = styled.span`
  font-size: 8px;
  color: grey;
`;
