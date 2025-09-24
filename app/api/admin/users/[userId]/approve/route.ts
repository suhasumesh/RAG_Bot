// app/api/admin/users/[userId]/approve/route.ts
import { NextResponse } from "next/server";
import { connectToMongo } from "../../../../../../lib/mongoDB";
import { User } from "../../../../../../models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify admin role
async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role === "admin") return decoded;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  await connectToMongo();

  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { approve } = await req.json();
  const { userId } = params;

  if (typeof approve !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid approve value" }, { status: 400 });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.isAdminApproved = approve;
    await user.save();

    const { password, ...userData } = user.toObject(); // exclude password
    return NextResponse.json(userData);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
