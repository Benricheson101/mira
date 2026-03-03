import type {Role} from './ai';

export type ConversationMessage = {
  role: Role;
  content: string;
  author: string;
  authorID: string;
  messageID: string;
  threadID?: string;
  parent?: string;
  startOfThread: boolean;
};

export class ConversationManager {
  messages = new Map<string, ConversationMessage>();

  addMessage(msg: ConversationMessage) {
    this.messages.set(msg.messageID, msg);
  }

  getConversation(leaf: string) {
    const messages: ConversationMessage[] = [];

    let parentID: string | undefined = leaf;
    while (parentID && this.messages.has(parentID)) {
      const msg: ConversationMessage = this.messages.get(parentID)!;
      messages.push(msg);
      parentID = msg.parent;
    }

    return messages.toReversed();
  }

  // TODO:
  deleteMessage(id: string) {
    this.messages.delete(id);
    this.cleanupOrphans();
  }

  // TODO: delete all conversations that don't begin with a startOfThread
  cleanupOrphans() {}
}
