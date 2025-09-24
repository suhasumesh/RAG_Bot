// app/api/chats/route.ts
import { NextResponse } from "next/server";
import { connectToMongo } from "../../../lib/mongoDB";
import { Chat } from "../../../models/Chat";

// --- 1. Create a New Chat ---
export async function POST(req: Request) {
  await connectToMongo();

  const { title, userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const newChat = await Chat.create({
    userId,
    title,
    messages: [],
  });

  return NextResponse.json(newChat);
}

// --- 2. Get/List All Chats for Sidebar ---
export async function GET(req: Request) {
  await connectToMongo();

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const chats = await Chat.find({ userId })
    .sort({ updatedAt: -1 })
    .select("_id title updatedAt");

  return NextResponse.json(chats);
}
