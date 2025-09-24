// app/api/chat/[chatId]/route.ts
import { NextResponse } from "next/server";
import { connectToMongo } from "../../../../../lib/mongoDB";
import { Chat } from "../../../../../models/Chat";

// --- 1️⃣ Get messages for a chat ---
export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  await connectToMongo();

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const chat = await Chat.findOne({
    _id: params.chatId,
    userId,
  });

  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  return NextResponse.json(chat.messages);
}

// --- 2️⃣ Add a message to backend ---
export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  await connectToMongo();

  const { userId, role, content } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (!role || !content) {
    return NextResponse.json({ error: "Missing role or content" }, { status: 400 });
  }

  const chat = await Chat.findOne({
    _id: params.chatId,
    userId,
  });

  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  const newMessage = {
    role,
    content,
    createdAt: new Date(),
  };

  chat.messages.push(newMessage);
  await chat.save();

  return NextResponse.json(chat.messages);
}
