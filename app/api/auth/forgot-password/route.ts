import { NextRequest, NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongoDB";
import { User } from "@/models/User";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    await connectToMongo();
    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP + expiry (10 minutes)
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const resetUrl = `http://localhost:3000/verify-otp?email=${encodeURIComponent(email)}`;

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
    });

    const mailHtml = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e0e0e0; padding:20px; border-radius:10px;">
      <h2 style="color:#2E86C1;">Password Reset OTP</h2>
      <p>Hi <strong>${user.firstName}</strong>,</p>
      <p>Your OTP for password reset is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
      <p>Click the link below to enter your OTP and reset your password:</p>
      <p style="text-align:center; margin:20px 0;">
        <a href="${resetUrl}" style="background-color:#2E86C1; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
          Enter OTP
        </a>
      </p>
      <p>If you did not request this, please ignore this email.</p>
      <hr />
      <p style="font-size:12px; color:#888;">Enterprise Support Team</p>
    </div>
  `;
    const companyName = "Avaali";
    const supportEmail = "suhasumesh11@gmail.com";
    await transporter.sendMail({
        from: `"Avaali Support" <${supportEmail}>`,
        to: email,
        subject: "Your Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}`,
        html: mailHtml,
    });

    return NextResponse.json({ message: "OTP sent to email" });
}
