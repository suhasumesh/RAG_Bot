import { NextRequest, NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongoDB";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  await connectToMongo();
  const { email, otp } = await req.json();

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.resetPasswordToken || !user.resetPasswordExpires) {
    return NextResponse.json({ error: "No OTP requested" }, { status: 400 });
  }

  if (user.resetPasswordExpires < new Date()) {
    return NextResponse.json({ error: "OTP expired" }, { status: 400 });
  }

  if (user.resetPasswordToken !== otp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  return NextResponse.json({ message: "OTP verified" });
}
