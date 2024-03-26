import React, { useState } from "react";

export const MessageInput = ({
  onSendMessage,
  replyingToMessage,
  isPWA = false,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const styles = {
    newMessageContainer: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      padding: "0px",
      margin: "1rem",
    },
    messageInputField: {
      flexGrow: 1,
      padding: "5px",
      border: "1px solid #ccc",
      borderRadius: "5px",
      fontSize: isPWA === true ? "12px" : "12px",
      width: isPWA === true ? "82%" : "",
      outline: "none",
    },
    sendButton: {
      padding: "5px 10px",
      marginLeft: "5px",
      border: "0px solid #ccc",
      cursor: "pointer",
      borderRadius: "5px",
      textAlign: "center",
      display: "flex",
      backgroundColor: "rgb(79 70 229)",
      justifyContent: "center",
      alignItems: "center",
      color: "white",
      height: "100%",
      fontSize: isPWA === true ? "1.0em" : ".8em",
      width: isPWA === true ? "12%" : "",
    },
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
    <div style={styles.newMessageContainer}>
      <input
        className="messageInputField"
        style={styles.messageInputField}
        type="text"
        value={newMessage}
        onKeyPress={handleInputChange}
        onChange={handleInputChange}
        placeholder="Type your message..."
      />
      <button
        className="sendButton"
        style={styles.sendButton}
        onClick={() => {
          onSendMessage(newMessage);
          setNewMessage("");
        }}>
        {isPWA ? "📤" : "Send"}
      </button>
    </div>
  );
};
