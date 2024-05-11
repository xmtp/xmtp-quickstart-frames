import React, { useState } from "react";
import { GroupChat } from "../Groups/GroupChat"; // Adjust the import path as necessary

const GroupChatUI = () => {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState("");
  const [groupChat, setGroupChat] = useState(null);
  const [managingBot, setManagingBot] = useState(null);
  const [accessBot, setAccessBot] = useState(null);

  const handleCreateGroup = () => {
    const newGroup = new GroupChat(groupName, members);
    if (managingBot) {
      newGroup.addMembers([managingBot]);
    }
    if (accessBot) {
      newGroup.addMembers([accessBot]);
    }
    setGroupChat(newGroup);
  };

  const handleAddMember = () => {
    setMembers([
      ...members,
      { name: memberInput, address: `${memberInput}@example.com` },
    ]);
    setMemberInput("");
  };

  return (
    <div>
      <h2>Create Group Chat</h2>
      <div>
        <label>Group Name:</label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>
      <div>
        <label>Add Member:</label>
        <input
          type="text"
          value={memberInput}
          onChange={(e) => setMemberInput(e.target.value)}
        />
        <button onClick={handleAddMember}>Add Member</button>
      </div>
      <div>
        <label>Managing Bot:</label>
        <input
          type="checkbox"
          checked={!!managingBot}
          onChange={() =>
            setManagingBot(
              managingBot
                ? null
                : { name: "ManagingBot", address: "managingbot@example.com" },
            )
          }
        />
      </div>
      <div>
        <label>Access Bot:</label>
        <input
          type="checkbox"
          checked={!!accessBot}
          onChange={() =>
            setAccessBot(
              accessBot
                ? null
                : { name: "AccessBot", address: "accessbot@example.com" },
            )
          }
        />
      </div>
      <button onClick={handleCreateGroup}>Create Group</button>
      {groupChat && (
        <div>
          <h3>Group Created: {groupChat.name}</h3>
          <p>Members:</p>
          <ul>
            {groupChat.listMembers().map((member, index) => (
              <li key={index}>
                {member.name} ({member.address})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GroupChatUI;
