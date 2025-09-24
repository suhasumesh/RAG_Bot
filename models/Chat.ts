import mongoose, { Schema, Document, Model, models, model } from "mongoose";

// 1. Define message type
export interface MessageItem {
  role: string;
  content: string;
  createdAt: Date;
}

// 2. Define chat document type
export interface ChatDoc extends Document {
  userId: string;
  title: string;
  messages: MessageItem[];
}

// 3. Schema
const chatSchema = new Schema<ChatDoc>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  messages: [
    {
      role: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: () => new Date() },
    },
  ],
});

// 4. Prevent OverwriteModelError
export const Chat: Model<ChatDoc> = models.Chat || model<ChatDoc>("Chat", chatSchema);
