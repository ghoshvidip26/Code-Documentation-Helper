import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
    role: string;
    content: string;
    chatId: string;
    createdAt: Date;
    updatedAt: Date;
}

const chatSchema = new Schema<IChat>({
    role: { type: String, required: true },
    content: { type: String, required: true },
    chatId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
})

const Chat = mongoose.model<IChat>('Chat', chatSchema)

export default Chat