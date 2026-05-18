import Datastore from 'nedb-promises';

export interface ChatMessage {
  _id?: string;
  roomId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

const chatDb = Datastore.create({
  filename: process.env.CHAT_DB_PATH ?? './chat.db',
  autoload: true,
  timestampData: false,
});

chatDb.ensureIndex({ fieldName: 'roomId' }).catch(() => undefined);
chatDb.ensureIndex({ fieldName: 'createdAt' }).catch(() => undefined);

export const chatStore = {
  async addMessage(message: Omit<ChatMessage, '_id'>): Promise<ChatMessage> {
    return chatDb.insert(message) as Promise<ChatMessage>;
  },

  async getMessages(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const rows = await chatDb.find({ roomId }).sort({ createdAt: 1 }).limit(limit);
    return rows as ChatMessage[];
  },
};
