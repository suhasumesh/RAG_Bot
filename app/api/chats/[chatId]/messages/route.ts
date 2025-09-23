import { NextResponse } from "next/server";
import { connectToMongo } from "../../../../../lib/mongoDB";
import { Chat } from "../../../../../models/Chat";
import { getServerSession } from "next-auth";

//1. Get messages for chat
export async function GET(req: Request,{ params }: { params: { chatId: string } }) {
  await connectToMongo();

  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chat = await Chat.findOne({ _id: params.chatId, userId: session.user.id });
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  return NextResponse.json(chat.messages);
}

//2. Add a message to Backend
export async function POST(req: Request, { params }: { params: { chatId: string } }) {
  await connectToMongo();

  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, content } = await req.json();
  const chat = await Chat.findOne({ _id: params.chatId, userId: session.user.id });
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

  chat.messages.push({ role, content });
  await chat.save();

  return NextResponse.json(chat.messages);
}

