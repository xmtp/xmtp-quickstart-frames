import React, { useState, useEffect } from "react";
import { Frame } from "../Frames/Frame";
import {
  getFrameTitle,
  isValidFrame,
  getOrderedButtons,
  isXmtpFrame,
} from "../Frames/FrameInfo";
import { FramesClient } from "@xmtp/frames-client";
import { readMetadata } from "../Frames/openFrames"; // Ensure you have this helper or implement it

export const MessageItem = ({ message, senderAddress, client }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [frameMetadata, setFrameMetadata] = useState();
  const [frameButtonUpdating, setFrameButtonUpdating] = useState(0);
  const [textInputValue, setTextInputValue] = useState("");

  const styles = {
    messageContent: {
      backgroundColor: "rgb(79 70 229)",
      padding: "5px 10px",
      alignSelf: "flex-start",
      textAlign: "left",
      color: "white",
      display: "inline-block",
      margin: "5px",
      borderRadius: "5px",
      maxWidth: "80%",
      wordBreak: "break-word",
      cursor: "pointer",
      listStyle: "none",
    },
    renderedMessage: {
      fontSize: "12px",
      wordBreak: "break-word",
      padding: "0px",
    },
    senderMessage: {
      alignSelf: "flex-start",
      textAlign: "left",
      listStyle: "none",
      width: "100%",
    },
    receiverMessage: {
      alignSelf: "flex-end",
      listStyle: "none",
      textAlign: "right",
      width: "100%",
    },
    footer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    timeStamp: {
      fontSize: "8px",
      color: "lightgrey",
    },
  };

  function onTextInputChange(event) {
    setTextInputValue(event.target.value);
  }
  const conversationTopic = message.contentTopic;

  const handleFrameButtonClick = async (buttonIndex, action = "post") => {
    console.log(buttonIndex, action);
    if (!frameMetadata || !client || !frameMetadata?.frameInfo?.buttons) {
      return;
    }
    const { frameInfo, url: frameUrl } = frameMetadata;
    if (!frameInfo.buttons) {
      return;
    }
    const button = frameInfo.buttons[buttonIndex];
    setFrameButtonUpdating(buttonIndex);
    const framesClient = new FramesClient(client);
    const postUrl = button.target || frameInfo.postUrl || frameUrl;
    const payload = await framesClient.signFrameAction({
      frameUrl,
      inputText: textInputValue || undefined,
      buttonIndex,
      conversationTopic,
      participantAccountAddresses: [senderAddress, client.address],
    });
    if (action === "post") {
      const updatedFrameMetadata = await framesClient.proxy.post(
        postUrl,
        payload,
      );
      setFrameMetadata(updatedFrameMetadata);
    } else if (action === "post_redirect") {
      const { redirectedTo } = await framesClient.proxy.postRedirect(
        postUrl,
        payload,
      );
      window.open(redirectedTo, "_blank");
    } else if (action === "link" && button?.target) {
      window.open(button.target, "_blank");
    }
    setFrameButtonUpdating(0);
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      setIsLoading(true);
      //Render localhost frames
      /*if (message.content.includes("localhost")) {
        const metadata = await readMetadata(message.content); // Ensure you have implemented this function
        if (metadata) {
          setFrameMetadata(metadata);
        }
      }*/
      if (typeof message.content === "string") {
        const words = message.content.split(/(\r?\n|\s+)/);
        const urlRegex =
          /^(http[s]?:\/\/)?([a-z0-9.-]+\.[a-z0-9]{1,}\/.*|[a-z0-9.-]+\.[a-z0-9]{1,})$/i;

        await Promise.all(
          words.map(async (word) => {
            const isUrl = !!word.match(urlRegex)?.[0];
            if (isUrl) {
              const metadata = await readMetadata(word); // Ensure you have implemented this function
              if (metadata) {
                setFrameMetadata(metadata);
              }
            }
          }),
        );
      }
      setIsLoading(false);
    };
    fetchMetadata();
  }, [message?.content]);

  const renderFooter = (timestamp) => {
    return (
      <div style={styles.footer}>
        <span style={styles.timeStamp}>
          {`${new Date(timestamp).getHours()}:${String(
            new Date(timestamp).getMinutes(),
          ).padStart(2, "0")}`}
        </span>
      </div>
    );
  };

  const renderMessage = (message) => {
    const codec = client.codecFor(message.contentType);
    let content = message.content;
    if (!codec) {
      /*Not supported content type*/
      if (message?.contentFallback !== undefined)
        content = message?.contentFallback;
      else return;
    }
    return (
      <div style={styles.messageContent}>
        <div style={styles.renderedMessage}>{content}</div>
        {renderFooter(message.sent)}
      </div>
    );
  };

  const isSender = senderAddress === client?.address;
  const showFrame = isValidFrame(frameMetadata);

  return (
    <li
      style={isSender ? styles.senderMessage : styles.receiverMessage}
      key={message.id}>
      {!frameMetadata?.frameInfo && renderMessage(message)}
      {isLoading && <div>Loading...</div>}
      {showFrame && !isLoading && frameMetadata?.frameInfo && (
        <div style={styles.messageContent}>
          <Frame
            image={frameMetadata?.frameInfo?.image.content}
            title={getFrameTitle(frameMetadata)}
            buttons={getOrderedButtons(frameMetadata)}
            handleClick={handleFrameButtonClick}
            frameButtonUpdating={frameButtonUpdating}
            interactionsEnabled={isXmtpFrame(frameMetadata)}
            textInput={frameMetadata?.frameInfo?.textInput?.content}
            onTextInputChange={onTextInputChange}
            frameUrl={frameMetadata?.url} // Add this line to pass the frame URL
          />
        </div>
      )}
    </li>
  );
};
