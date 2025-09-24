import { NextResponse } from "next/server";
import { connectToMongo } from "../../../../lib/mongoDB";
import { User } from "../../../../models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify admin JWT
async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log(JSON.stringify(decoded));
    if (decoded.role === "admin") return decoded;
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  await connectToMongo();
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await User.find({}, { password: 0 }).lean(); // exclude passwords
  return NextResponse.json(users);
}
