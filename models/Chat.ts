// models/Chat.ts
import mongoose, { Schema, model, models } from "mongoose";

const ChatSchema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Chat = models.Chat || model("Chat", ChatSchema);
