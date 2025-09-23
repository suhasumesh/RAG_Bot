// app/api/chats/route.ts
import { NextResponse } from "next/server";
import { connectToMongo } from "../../../lib/mongoDB";
import { Chat } from "../../../models/Chat";
import { getServerSession } from "next-auth"; // if you're using next-auth

//1. Create a New chat
export async function POST(req: Request) {
  await connectToMongo();

  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = await req.json();

  const newChat = await Chat.create({
    userId: session.user.id,
    title,
    messages: [],
  });

  return NextResponse.json(newChat);
}

//2. Get/List All chats for Side Bar
export async function GET() {
  await connectToMongo();

  // 🔐 get logged-in user
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  //get all user chats
  const chats = await Chat.find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .select("_id title updatedAt");

  return NextResponse.json(chats);
}


