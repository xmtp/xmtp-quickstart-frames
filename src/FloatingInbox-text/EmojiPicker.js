import React, { useRef, useEffect } from "react";
import { ReactComponent as Degen } from "./DegenEmoji.svg"; // Import your custom SVG
const emojis = [
  "❤️",
  "😍",
  "💪🏻",
  "🫡",
  <Degen emojiType="degen" style={{ width: "12px", height: "12px" }} />,
]; // Add the SVG as a React component

export const EmojiPicker = ({ onSelect }) => {
  const pickerRef = useRef(null);
  const styles = {
    EmojiPickerContainer: {
      display: "block",
      backgroundColor: "darkgray",
      padding: "5px",
      borderRadius: "10px",
    },
    ReplyButton: {
      cursor: "pointer",
      display: "block",
      textDecoration: "underline",
    },
    EmojiItem: {
      cursor: "pointer",
      fontSize: "12px",
    },
    emoji: {
      width: "10px !important;",
    },
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onSelect(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [onSelect]);

  return (
    <div style={styles.EmojiPickerContainer} ref={pickerRef}>
      <span style={styles.ReplyButton} onClick={() => onSelect("reply")}>
        Reply
      </span>
      {emojis.map((emoji, index) => (
        <span
          style={styles.EmojiItem}
          key={index}
          onClick={() => {
            // Check if the emoji has the emojiType prop and if it's "degen"
            const emojiType = emoji.props && emoji.props.emojiType;
            onSelect(emojiType ? emojiType : emoji);
          }}
          role="img"
          className="emoji"
          aria-label={`emoji-${index}`}>
          {typeof emoji === "string"
            ? emoji
            : React.cloneElement(emoji, { style: styles.EmojiItem })}
        </span>
      ))}
    </div>
  );
};
