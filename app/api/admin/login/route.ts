import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Hardcoded admin credentials (replace with DB or JWT later)
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
};

const JWT_SECRET  = process.env.JWT_SECRET;

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    // For now, simple dummy token
    const token = jwt.sign(
        { email, role: "admin" },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      return NextResponse.json({ token, email, role: "admin" });
  }

  return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
}
