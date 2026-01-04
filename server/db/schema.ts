import mongoose, { Schema, Document } from "mongoose";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface IChat extends Document {
  chatId: string;
  framework: string;
  history: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<ChatMessage>({
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new Schema<IChat>(
  {
    chatId: { type: String, required: true },
    framework: { type: String, required: true },
    history: { type: [messageSchema], default: [] }
  },
  { timestamps: true }
);

const Chat =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
