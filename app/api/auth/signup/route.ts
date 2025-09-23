import { NextResponse } from "next/server";
import { connectToMongo } from "@/lib/mongoDB";
import { User } from "@/models/User";
import nodemailer from "nodemailer";

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

    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
    });

    const sendWelcomeMail = async (user: any) => {
      const companyName = "Avaali";
      const supportEmail = "suhasumesh11@gmail.com";

      const userHtml = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e0e0e0; padding:20px; border-radius:10px; background-color:#f4f9f4;">
      <h2 style="color:#27AE60;">Welcome to ${companyName}!</h2>
      <p>Hi <strong>${user.firstName}</strong>,</p>
      <p>Thank you for registering to <strong>${companyName}</strong>. We're thrilled to have you on board.</p>
      
      <p>Your account has been successfully created with the email: <strong>${user.email}</strong>.</p>

      <p>To get started, you can log in using your credentials and explore all the features we offer.</p>
      
      <p style="text-align:center; margin:20px 0;">
        <a href="http://localhost:3000/login" 
           style="color:#fff; background-color:#27AE60; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">
          Go to Dashboard
        </a>
      </p>

      <hr />
      <p style="font-size:12px; color:#888;">
        This is an automated message from ${companyName}. 
        If you did not register, please contact 
        <a href="mailto:${supportEmail}" style="color:#27AE60;">${supportEmail}</a>.
      </p>
    </div>
  `;

      await transporter.sendMail({
        from: `"${companyName} Support" <${process.env.EMAIL}>`,
        to: user.email,
        subject: "Welcome to Avaali!",
        text: `Hi ${user.firstName}, welcome to ${companyName}! Your account (${user.email}) has been successfully created.`,
        html: userHtml,
      });
    };
    await sendWelcomeMail(user);
    await user.save();
    return NextResponse.json({ message: "User registered successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
