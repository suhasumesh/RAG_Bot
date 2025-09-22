import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongoDB";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectToMongo();

    const {
      firstName,
      lastName,
      email,
      companyName,
      companyAddress,
      phone,
      password,
      confirmPassword,
    } = await req.json();

    // Validate confirm password
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      companyName,
      companyAddress,
      phone,
      password, // hashed by pre-save hook
    });

    await user.save();
    return NextResponse.json({ message: "User registered successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
