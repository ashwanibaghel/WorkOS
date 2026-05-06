import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const isSmtpConfigured = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const transporter = () => nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

export const emailService = {
  async sendVerificationEmail({ to, name, verificationUrl }) {
    if (!isSmtpConfigured()) {
      if (env.nodeEnv === "production") {
        throw new AppError("Email service is not configured. Configure SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM.", 503);
      }
      console.log(`Email verification link for ${to}: ${verificationUrl}`);
      return { sent: false, devVerificationUrl: verificationUrl };
    }

    await transporter().sendMail({
      from: env.mailFrom,
      to,
      subject: "Verify your WorkOS email",
      text: [
        `Hi ${name},`,
        "",
        "Verify your email to activate your WorkOS account:",
        verificationUrl,
        "",
        "This link expires in 24 hours."
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#17202a">
          <h2>Verify your WorkOS email</h2>
          <p>Hi ${escapeHtml(name)},</p>
          <p>Verify your email to activate your WorkOS account.</p>
          <p><a href="${verificationUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Verify email</a></p>
          <p>This link expires in 24 hours.</p>
        </div>
      `
    });

    return { sent: true };
  }
};
