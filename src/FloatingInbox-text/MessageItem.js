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

  const handleFrameButtonClick1 = async (buttonIndex, action = "post") => {
    if (!frameMetadata || !client || !frameMetadata?.frameInfo?.buttons) {
      return;
    }
    const { frameInfo, url: frameUrl } = frameMetadata;
    if (!frameInfo.buttons) {
      return;
    }
    const button = frameInfo.buttons[buttonIndex];
    setFrameButtonUpdating(buttonIndex);

    const postUrl = button.target || frameInfo.postUrl || frameUrl;

    // Constructing the Frame Signature Packet manually
    const frameAction = {
      // Assuming the structure aligns with what Farcaster expects
      frameUrl,
      buttonIndex,
      inputText: textInputValue || undefined,
      conversationTopic,
      participantAccountAddresses: [senderAddress, client.address],
      // Use XMTP address as fid if Farcaster fid is not available
      fid: client.address, // Simplification for example purposes
    };

    // Example payload, adjust according to actual Frame Signature Packet structure
    const payload = {
      untrustedData: {
        fid: frameAction.fid,
        url: frameAction.frameUrl,
        buttonIndex: frameAction.buttonIndex,
        inputText: frameAction.inputText,
        // Additional fields as required by the Farcaster spec
      },
      // trustedData would be included here after being signed appropriately
    };
    // Adjust HTTP method and headers as necessary
    const requestOptions = {
      method: "POST",
      mode: "no-cors", // This disables CORS checks
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };

    try {
      let response;
      if (action === "post" || action === "post_redirect") {
        const proxyUrl = "https://cors-anywhere.herokuapp.com/";
        response = await fetch(`${proxyUrl}${postUrl}`, requestOptions);
        console.log(response);
        if (action === "post_redirect" && response.ok) {
          console.log("entra");
          // Assuming the server responds with a redirect URL in the body or headers
          const redirectUrl =
            response.headers.get("Location") ||
            (await response.json().redirectUrl);
          window.open(redirectUrl, "_blank");
        }
      } else if (action === "link" && button?.target) {
        window.open(button.target, "_blank");
      }

      if (response && response.ok) {
        // Handle successful response, e.g., updating frame metadata
        const updatedFrameMetadata = await response.json();
        setFrameMetadata(updatedFrameMetadata);
      }
    } catch (error) {
      console.error("Error handling frame button click:", error);
    } finally {
      setFrameButtonUpdating(0);
    }
  };
  const handleFrameButtonClick = async (buttonIndex, action = "post") => {
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
            interactionsEnabled={true /*isXmtpFrame(frameMetadata)*/}
            textInput={frameMetadata?.frameInfo?.textInput?.content}
            onTextInputChange={onTextInputChange}
            frameUrl={frameMetadata?.url} // Add this line to pass the frame URL
          />
        </div>
      )}
    </li>
  );
};
