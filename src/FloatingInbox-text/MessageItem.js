import React, { useState, useEffect } from "react";
import { Frame } from "../Frames/Frame";
import {
  getFrameTitle,
  isValidFrame,
  getOrderedButtons,
  isXmtpFrame,
} from "../Frames/FrameInfo";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

import { FramesClient } from "@xmtp/frames-client";
import { fetchFrameFromUrl } from "../Frames/utils"; // Ensure you have this helper or implement it

const walletClient = createWalletClient({
  chain: sepolia,
  transport: custom(window.ethereum),
});

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
      listStyle: "none",
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
      console.log(button);
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
          payload,
        );
        console.log("Transaction info", transactionInfo);

        if (transactionInfo.method === "eth_personalSign") {
          const { value } = transactionInfo.params;
          const signature = await walletClient.signMessage({
            account: client,
            message: value,
          });

          const payloadWithTxId = await framesClient.signFrameAction({
            frameUrl,
            inputText: textInputValue || undefined,
            buttonIndex,
            conversationTopic,
            participantAccountAddresses: [senderAddress, client.address],
            address: client.address,
            state: frameInfo.state,
            transactionId: signature,
          });

          const completeTransactionMetadata = await framesClient.proxy.post(
            button.postUrl,
            payloadWithTxId,
          );
          setFrameMetadata(completeTransactionMetadata);
        } else {
          const address = transactionInfo.params.to;

          try {
            const hash = await walletClient.sendTransaction({
              account: client.address,
              to: address,
              value: transactionInfo.params.value, // 1 as bigint
              data: transactionInfo.params.data,
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

  const renderMessage = (message) => {
    const codec = client.codecFor(message.contentType);
    let content = message.content;

    // Handle 'reply' content type by accessing message.content.content
    if (message.contentType === "reply") {
      content = message.content.content;
    }
    if (frameMetadata?.url && showFrame) {
      content = content.replace(frameMetadata.url, "");
    }

    if (!codec) {
      /*Not supported content type*/
      if (message?.contentFallback !== undefined)
        content = message?.contentFallback;
      else return;
    }

    // Render the content safely
    return (
      <div style={styles.messageContent}>
        {showFrame && frameMetadata?.frameInfo && (
          <>
            {isLoading && (
              <div style={styles.renderedMessage}>{"Loading..."}</div>
            )}
            <Frame
              image={frameMetadata?.frameInfo?.image?.content}
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
        {/* Ensure content is rendered safely */}
        <div style={styles.renderedMessage}>
          {typeof content === "string" ? content : content.content}
        </div>
        {renderFooter(message.sent)}
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
