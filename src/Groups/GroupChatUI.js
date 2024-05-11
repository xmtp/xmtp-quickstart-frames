import React, { useState } from "react";
import { GroupChat } from "../Groups/GroupChat"; // Adjust the import path as necessary

const GroupChatUI = () => {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState("");
  const [groupChat, setGroupChat] = useState(null);
  const [managingBots, setManagingBots] = useState([]);
  const [accessBots, setAccessBots] = useState([]);

  const bots = [
    {
      id: 1,
      title: "ManagingBot",
      description: "Handles group management tasks",
      address: "managingbot@example.com",
    },
    {
      id: 2,
      title: "AccessBot",
      description: "Controls access permissions",
      address: "accessbot@example.com",
    },
    // Add more bots as needed
  ];

  const handleCreateGroup = () => {
    const newGroup = new GroupChat(groupName, members);
    newGroup.addMembers([...managingBots, ...accessBots]);
    setGroupChat(newGroup);
  };

  const handleAddMember = () => {
    setMembers([
      ...members,
      { name: memberInput, address: `${memberInput}@example.com` },
    ]);
    setMemberInput("");
  };

  const handleSelectBots = (selectedBots, type) => {
    const selected = bots.filter((bot) => selectedBots.includes(bot.id));
    if (type === "managing") {
      setManagingBots(selected);
    } else {
      setAccessBots(selected);
    }
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backgroundColor: "#f0f0f0",
    },
    input: {
      margin: "5px",
      padding: "10px",
      width: "300px",
      borderRadius: "5px",
      border: "1px solid #ccc",
    },
    button: {
      padding: "10px 20px",
      margin: "10px",
      backgroundColor: "rgb(79, 70, 229)",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    label: {
      margin: "5px",
      fontWeight: "bold",
    },
    select: {
      width: "310px",
      padding: "10px",
      margin: "5px",
      borderRadius: "5px",
      border: "1px solid #ccc",
    },
  };

  return (
    <div style={styles.container}>
      <h2>Create group chat</h2>
      <div>
        <label style={styles.label}>Group name:</label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={styles.input}
        />
      </div>
      <div>
        <label style={styles.label}>Add member:</label>
        <input
          type="text"
          value={memberInput}
          onChange={(e) => setMemberInput(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAddMember} style={styles.button}>
          Add member
        </button>
      </div>
      <div>
        <label style={styles.label}>Managing bots:</label>
        <select
          multiple
          style={styles.select}
          onChange={(e) =>
            handleSelectBots(
              Array.from(e.target.selectedOptions, (option) =>
                parseInt(option.value),
              ),
              "managing",
            )
          }>
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id}>
              {bot.title} - {bot.description}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={styles.label}>Access bots:</label>
        <select
          multiple
          style={styles.select}
          onChange={(e) =>
            handleSelectBots(
              Array.from(e.target.selectedOptions, (option) =>
                parseInt(option.value),
              ),
              "access",
            )
          }>
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id}>
              {bot.title} - {bot.description}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleCreateGroup} style={styles.button}>
        Create Group
      </button>
    </div>
  );
};

export default GroupChatUI;
