// /api/auth/users/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToMongo } from "../../../../../lib/mongoDB";
import { User } from "@/models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  await connectToMongo();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > new Date()) {
    return NextResponse.json({ error: "Account locked. Contact Admin." }, { status: 403 });
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    user.failedLoginAttempts += 1;

    // Lock account after 3 failed attempts
    if (user.failedLoginAttempts >= 3) {
      user.lockUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

      // Generate token for reset URL (expires in 2 days)
      const resetToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: "2d" }
      );

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires =  new Date(Date.now()+2*24*60*60*1000);
      const resetUrl = `http://localhost:3000/reset-account?token=${resetToken}`;

      // Send notification email to Admin and User
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
      });

      const sendEnterpriseMail = async (user: any) => {
        const companyName = "Avaali";
        const supportEmail = "suhasumesh11@gmail.com";

        // Admin HTML
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e0e0e0; padding:20px; border-radius:10px;">
            <h2 style="color:#2E86C1;">Account Lock Notification</h2>
            <p>User <strong>${user.email}</strong> has been locked due to multiple failed login attempts.</p>
            <p>Please review and take necessary action via the admin panel.</p>
            <hr />
            <p style="font-size:12px; color:#888;">This is an automated message from ${companyName}.</p>
          </div>
        `;

        // User HTML
        const userHtml = `
          <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e0e0e0; padding:20px; border-radius:10px;">
            <h2 style="color:#C0392B;">Account Locked</h2>
            <p>Hi <strong>${user.firstName}</strong>,</p>
            <p>Your account (<strong>${user.email}</strong>) has been locked due to multiple failed login attempts.</p>
            <p>Please <a href="${resetUrl}" style="color:#fff; background-color:#C0392B; padding:10px 15px; margin:5px; text-decoration:none; border-radius:5px;">Unlock Your Account</a> or contact<p> <a href="mailto:${supportEmail}">${supportEmail}</a></p> for assistance.</p>
            <hr />
            <p style="font-size:12px; color:#888;">This is an automated message from ${companyName}. If you did not attempt to login, please secure your account immediately.</p>
          </div>
        `;

        await transporter.sendMail({
          from: `"${companyName} Alerts" <${process.env.EMAIL}>`,
          to: process.env.ADMIN_EMAIL,
          subject: "User Account Locked Alert",
          text: `User ${user.email} has been locked due to multiple failed login attempts.`,
          html: adminHtml,
        });

        await transporter.sendMail({
          from: `"${companyName} Support" <${process.env.EMAIL}>`,
          to: user.email,
          subject: "Your Account is Locked",
          text: `Hi ${user.firstName}, your account (${user.email}) has been locked. Please unlock via the link: ${resetUrl}`,
          html: userHtml,
        });
      };

      await sendEnterpriseMail(user);
    }

    await user.save();
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  // Check if approved by admin
  if (!user.isAdminApproved) {
    return NextResponse.json({ error: "User not approved by Admin" }, { status: 403 });
  }

  // Generate JWT for session
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, isAdminApproved: user.isAdminApproved },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return NextResponse.json({ token });
}
