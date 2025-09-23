import { NextRequest, NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongoDB";
import { User } from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  await connectToMongo();
  const { token, newPassword } = await req.json();

  if (!token || !newPassword) return NextResponse.json({ error: "Token and password required" }, { status: 400 });

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

  // Hash new password and save
//   const hashed = await bcrypt.hash(newPassword, 10); not required because i am using pre save function
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.failedLoginAttempts=0;
  user.lockUntil=undefined;

  await user.save();
  return NextResponse.json({ success: true });
}
