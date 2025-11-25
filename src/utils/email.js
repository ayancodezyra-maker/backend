// Email utility
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { verificationEmailHTML } from "./emailTemplates.js";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* CURSOR PATCH START */

export async function sendEmailVerification(fullName, email, verifyUrl) {
  const html = verificationEmailHTML(fullName, verifyUrl);

  return await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify your BidRoom account",
    html,
  });
}

// Send OTP email for MFA
export async function sendOtpEmail(name, email, otp) {
  const html = `
    <html>
    <body style="font-family: Arial; padding:20px;">
      <div style="max-width:600px; margin:auto; background:white; padding:30px;">
        <h2>Your BidRoom Login OTP</h2>
        <p>Hello ${name || "there"},</p>
        <p>Your login OTP is: <b>${otp}</b></p>
        <p>Valid for 10 minutes.</p>
      </div>
    </body>
    </html>
  `;

  return await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Your BidRoom Login OTP",
    html,
  });
}
/* CURSOR PATCH END */
