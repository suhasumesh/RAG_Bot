import { NextResponse } from "next/server";
import { connectToMongo } from "../../../../../lib/mongoDB";
import { User } from "../../../../../models/User";
import { Chat } from "../../../../../models/Chat";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import ExcelJS from "exceljs";

const JWT_SECRET = process.env.JWT_SECRET;

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    if (decoded.role === "admin") return decoded;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  await connectToMongo();
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const users = await User.find({}, { password: 0 }).lean();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Users & Chats");

    sheet.columns = [
      { header: "Email", key: "email", width: 30 },
      { header: "Role", key: "role", width: 15 },
      { header: "Approved", key: "isAdminApproved", width: 10 },
      { header: "Created At", key: "createdAt", width: 25 },
      { header: "Chat Title", key: "chatTitle", width: 30 },
      { header: "Message Role", key: "messageRole", width: 15 },
      { header: "Message Content", key: "messageContent", width: 50 },
      { header: "Message Timestamp", key: "messageTime", width: 25 },
    ];

    for (const u of users) {
      const chats = await Chat.find({ userId: u._id }).lean();
      if (chats.length === 0) {
        sheet.addRow({
          email: u.email,
          role: u.role,
          isAdminApproved: u.isAdminApproved ? "Yes" : "No",
          createdAt: new Date(u.createdAt).toLocaleString(),
          chatTitle: "",
          messageRole: "",
          messageContent: "",
          messageTime: "",
        });
      } else {
        chats.forEach((chat) => {
          chat.messages.forEach((msg) => {
            sheet.addRow({
              email: u.email,
              role: u.role,
              isAdminApproved: u.isAdminApproved ? "Yes" : "No",
              createdAt: new Date(u.createdAt).toLocaleString(),
              chatTitle: chat.title,
              messageRole: msg.role,
              messageContent: msg.content,
              messageTime: new Date(msg.createdAt).toLocaleString(),
            });
          });
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    // Send email to admin
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    const companyName = "Avaali";
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e0e0e0; padding:20px; border-radius:10px;">
        <h2 style="color:#2E86C1;">User Data & Chat Export</h2>
        <p>Hi Admin,</p>
        <p>The latest user data along with their chat history has been exported. Please find the attached Excel file.</p>
        <hr />
        <p style="font-size:12px; color:#888;">This is an automated message from ${companyName}.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"${companyName} Alerts" <${process.env.EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "Exported User Data & Chats",
      text: "Please find the attached exported user data with chat history.",
      html: adminHtml,
      attachments: [{ filename: "users_chats.xlsx", content: buffer }],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to export user data" }, { status: 500 });
  }
}
