class GroupChat {
  constructor(name, members) {
    this.name = name;
    this.members = members;
    this.messages = [];
  }

  send(sender, message) {
    this.messages.push({ sender, message });
  }

  listGroups() {
    // This method would typically be in a higher scope managing multiple groups
    console.log("List of all groups:");
  }

  groupMessages() {
    return this.messages;
  }

  groupMemberAddresses() {
    return this.members.map((member) => member.address);
  }

  addMembers(newMembers) {
    this.members = [...this.members, ...newMembers];
  }

  removeMembers(membersToRemove) {
    this.members = this.members.filter(
      (member) => !membersToRemove.includes(member),
    );
  }

  listMembers() {
    return this.members;
  }
}
