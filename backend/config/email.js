import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const GMAIL_USER = process.env.GMAIL_USER || 'mr2007tamilselvan@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'pnqcejqqlqhzfhpw';

// Create a Nodemailer transporter using Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

/**
 * Generic helper to send an email via Nodemailer
 * @param {string} toEmail 
 * @param {string} subject 
 * @param {string} htmlContent 
 * @returns {Promise<object>}
 */
const sendNodemailerEmail = async (toEmail, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `Secure Personal Vault <${GMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[NodeMailer Success] Email sent successfully to: ${toEmail}. Message ID: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('[NodeMailer Error] Error sending email:', err.message);
    throw new Error(`Failed to send email via NodeMailer: ${err.message}`);
  }
};

/**
 * Send OTP Verification Email
 * @param {string} toEmail 
 * @param {string} otpCode 
 * @returns {Promise<boolean>}
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #2563eb, #4f46e5); border-radius: 12px; line-height: 48px; text-align: center; color: white; font-size: 24px; font-weight: bold; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
          🔒
        </div>
        <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Secure Personal Vault</h2>
        <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500;">Your Encrypted Digital Safe</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-top: 0;">Hello,</p>
      <p style="font-size: 16px; line-height: 1.6; color: #334155;">You requested an OTP verification code to reset your master password. Please use the following 6-digit code to complete your verification:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2563eb; margin: 24px 0; font-family: 'Courier New', Courier, monospace;">
        ${otpCode}
      </div>
      <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 24px;">This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-bottom: 0;">
        Secure Personal Vault &copy; 2026. All rights reserved.
      </p>
    </div>
  `;

  await sendNodemailerEmail(toEmail, 'OTP Verification - Secure Personal Vault Password Reset', html);
  return true;
};

/**
 * Send Password Reset Link Email (Firebase-based)
 * @param {string} toEmail 
 * @param {string} resetLink 
 * @param {string} username 
 * @returns {Promise<boolean>}
 */
export const sendResetLinkEmail = async (toEmail, resetLink, username) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #2563eb, #4f46e5); border-radius: 12px; line-height: 48px; text-align: center; color: white; font-size: 24px; font-weight: bold; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
          🔑
        </div>
        <h2 style="color: #0f172a; margin-top: 12px; margin-bottom: 4px; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Secure Personal Vault</h2>
        <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500;">Your Encrypted Digital Safe</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-top: 0;">Hello ${username || 'User'},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #334155;">We received a request to reset the password for your Secure Personal Vault master account. Click the button below to choose a new password:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); transition: all 0.2s;">
          Reset Master Password
        </a>
      </div>
      <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 24px;">
        If the button above doesn't work, copy and paste this URL into your browser:
        <br />
        <a href="${resetLink}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${resetLink}</a>
      </p>
      <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin-bottom: 24px;">This link is valid for 1 hour. If you did not make this request, you can safely ignore this email and your password will remain unchanged.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-bottom: 0;">
        Secure Personal Vault &copy; 2026. All rights reserved.
      </p>
    </div>
  `;

  await sendNodemailerEmail(toEmail, 'Reset Master Password - Secure Personal Vault', html);
  return true;
};
