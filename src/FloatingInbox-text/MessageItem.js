import React, { useState, useEffect } from "react";
import { Frame } from "../Frames/Frame";
import {
  getFrameTitle,
  isValidFrame,
  getOrderedButtons,
  isXmtpFrame,
} from "../Frames/FrameInfo";
import { ReactComponent as Degen } from "./DegenEmoji.svg"; // Import your custom SVG
import { EmojiPicker } from "./EmojiPicker";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

import { useNavigate } from "react-router-dom";
import { FramesClient } from "@xmtp/frames-client";
import { fetchFrameFromUrl } from "../Frames/utils"; // Ensure you have this helper or implement it

import { ContentTypeReaction } from "@xmtp/content-type-reaction";

export const MessageItem = ({
  message,
  senderAddress,
  client,
  onReaction,
  messageReactions,
  conversation,
  setSelectedConversation2,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [frameMetadata, setFrameMetadata] = useState();
  const [frameButtonUpdating, setFrameButtonUpdating] = useState(0);
  const [textInputValue, setTextInputValue] = useState("");
  const [reactions, setReactions] = useState(messageReactions || []);

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
      listStyle: "none",
    },
    deepLink: {
      color: "white",
      textDecoration: "underline",
      fontSize: "12px",
    },
    renderedMessage: {
      fontSize: "12px",
      wordBreak: "break-word",
      padding: "0px",
      maxWidth: "300px",
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

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const handleEmojiPick = (emojiData) => {
    let emoji = emojiData.emoji; // Access the emoji from the object
    if (emojiData.emoji?.props?.emojiType) emoji = emoji.props.emojiType;

    const receiverAddress = emojiData.receiverAddress || "";
    if (emoji) {
      setReactions((prevReactions) => {
        const existingEmoji = prevReactions.find((r) => r.emoji === emoji);
        if (existingEmoji) {
          return prevReactions.filter((r) => r.emoji !== emoji);
        }
        return [...prevReactions, emojiData]; // Store the entire object
      });
      onReaction(message, emoji, receiverAddress); // Pass receiverAddress if needed in onReaction
    }
    setShowEmojiPicker(false);
  };
  function onTextInputChange(event) {
    setTextInputValue(event.target.value);
  }
  const conversationTopic = message.contentTopic;

  const handleFrameButtonClick = async (buttonIndex, action = "post") => {
    try {
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
        address: client.address,
        state: frameInfo.state,
      });

      if (action === "tx") {
        const transactionInfo = await framesClient.proxy.postTransaction(
          button.target,
          {
            ...payload,
          },
        );
        const address = transactionInfo.params.to;

        try {
          const walletClient = createWalletClient({
            chain: sepolia,
            transport: custom(window.ethereum),
          });

          const hash = await walletClient.sendTransaction({
            account: client.address,
            to: address,
            value: transactionInfo.params.value, // 1 as bigint
          });

          const buttonPostUrl =
            frameMetadata.extractedTags["fc:frame:button:1:post_url"];
          const completeTransactionMetadata = await framesClient.proxy.post(
            buttonPostUrl,
            {
              ...payload,
              transactionId: hash,
            },
          );
          setFrameMetadata(completeTransactionMetadata);
        } catch (e) {
          console.log("Transaction error", e);
        }
      } else if (action === "post") {
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
    } catch (e) {
      setShowAlert(true);
      setAlertMessage(e.message);
      //alert("Error: " + e.message);
      console.error(e);
    }
  };
  const [isXmtpFrameInitial, setIsXmtpFrameInitial] = useState(false); // Add this line

  useEffect(() => {
    const fetchMetadata = async () => {
      setIsLoading(true);
      const metadata = await fetchFrameFromUrl(message);
      setFrameMetadata(metadata);
      setIsXmtpFrameInitial(isXmtpFrame(metadata)); // Set the initial isXmtpFrame value here

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

  const handleSelect = (selected) => {
    if (selected === "reply") {
      //handleReplyPick(selected);
    } else {
      handleEmojiPick(selected);
    }
  };
  const renderMessage = (message) => {
    const codec = client.codecFor(message.contentType);
    let content = message.content;
    if (frameMetadata?.url && showFrame)
      content = content.replace(frameMetadata?.url, "");
    if (message.contentType.sameAs(ContentTypeReaction)) {
    } else if (!codec) {
      /*Not supported content type*/
      if (message?.contentFallback !== undefined)
        content = message?.contentFallback;
      else return;
    }
    // Replace newline characters with <br /> tags
    content = content.split("\n").join("<br />");

    const deepLinkRegex = /dm:\/[0-9a-zA-Z]+(\?[a-zA-Z0-9=&]+)?/;
    let deepLinkMatch = content.match(deepLinkRegex);
    if (deepLinkMatch) {
      deepLinkMatch = deepLinkMatch[0];
      content = content.replace(deepLinkMatch, "");
      deepLinkMatch = deepLinkMatch.replace("dm:", "");
    }

    const handleEmojiRightClick = (event) => {
      event.stopPropagation();
      event.preventDefault(); // Prevent the default context menu from opening

      setShowEmojiPicker(!showEmojiPicker);
    };
    const handleDeepLinkClick = (deepLinkMatch, event) => {
      setSelectedConversation2(deepLinkMatch.replace("/", "")); // Add this line
    };

    // Check if the message starts with a slash command
    const isSlashCommand = content.trim().startsWith("/");
    const playButton = isSlashCommand ? (
      <span className="play-button" onClick={() => sendMessage(content.trim())}>
        ▶️
      </span>
    ) : null;

    // Function to simulate sending a message
    const sendMessage = async (messageText) => {
      await conversation.send(messageText);
    };
    const renderEmoji = (emojiData) => {
      //degen
      if (emojiData.emoji === "degen") {
        return <Degen />;
      } else {
        return emojiData.emoji;
      }
    };

    return (
      <div
        style={styles.messageContent}
        onContextMenu={(event) => handleEmojiRightClick(event)}>
        {playButton}
        {showFrame && frameMetadata?.frameInfo && (
          <>
            {isLoading && (
              <div style={styles.renderedMessage}>{"Loading..."}</div>
            )}
            <Frame
              image={frameMetadata?.frameInfo?.image.content}
              title={getFrameTitle(frameMetadata)}
              buttons={getOrderedButtons(frameMetadata)}
              handleClick={handleFrameButtonClick}
              frameButtonUpdating={frameButtonUpdating}
              showAlert={showAlert}
              alertMessage={alertMessage}
              onClose={() => setShowAlert(false)}
              interactionsEnabled={isXmtpFrameInitial}
              textInput={frameMetadata?.frameInfo?.textInput?.content}
              onTextInputChange={onTextInputChange}
              frameUrl={frameMetadata?.url}
            />
          </>
        )}
        <div
          style={styles.renderedMessage}
          dangerouslySetInnerHTML={{ __html: content }}></div>
        {deepLinkMatch && (
          <span
            onClick={(event) => handleDeepLinkClick(deepLinkMatch, event)}
            style={styles.deepLink}>
            Go to conversation
          </span>
        )}
        {renderFooter(message.sent)}
        {!deepLinkMatch && (
          <div style={styles.ReactionAndReplyDiv}>
            {reactions.map((emoji, index) => (
              <span
                key={index}
                className="emoji-reaction"
                onClick={() => handleEmojiPick(emoji)}
                role="img"
                aria-label={`emoji-reaction-${index}`}>
                {renderEmoji(emoji)}
              </span>
            ))}
            {showEmojiPicker && <EmojiPicker onSelect={handleSelect} />}
          </div>
        )}
      </div>
    );
  };
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const isSender = senderAddress === client?.address;
  const showFrame = isValidFrame(frameMetadata);
  return (
    <li
      style={isSender ? styles.senderMessage : styles.receiverMessage}
      key={message.id}>
      {renderMessage(message)}
    </li>
  );
};
