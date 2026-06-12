import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter using environment variables or fallback to a mock/log helper
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });
  }

  // Fallback to null (we will handle console logging for development)
  return null;
};

/**
 * Send OTP Verification Email
 * @param {string} toEmail 
 * @param {string} otpCode 
 * @returns {Promise<boolean>}
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const transporter = getTransporter();
  const fromName = process.env.SMTP_FROM || '"Secure Personal Vault" <noreply@personalvault.com>';

  const mailOptions = {
    from: fromName,
    to: toEmail,
    subject: 'OTP Verification - Secure Personal Vault Password Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded-corners: 12px; background-color: #fcfcfc;">
        <h2 style="color: #2563eb; text-align: center;">Secure Personal Vault</h2>
        <hr style="border: 0; border-top: 1px solid #eeeeee;" />
        <p style="font-size: 16px; color: #333333;">Hello,</p>
        <p style="font-size: 16px; color: #333333;">You requested an OTP verification code to reset your master password. Please use the following 6-digit code to complete your verification:</p>
        <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #111827; margin: 20px 0;">
          ${otpCode}
        </div>
        <p style="font-size: 14px; color: #6b7280;">This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eeeeee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Secure Personal Vault &copy; 2026. All rights reserved.</p>
      </div>
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Verification email sent successfully to: ${toEmail}`);
      return true;
    } catch (err) {
      console.error('[SMTP] Error sending email:', err.message);
      throw new Error('Failed to send verification email. Please check server SMTP configurations.');
    }
  } else {
    // Development Fallback: Log to console
    console.log(`\n==================================================`);
    console.log(`[DEV FALLBACK] Verification Email for: ${toEmail}`);
    console.log(`[DEV FALLBACK] OTP CODE IS: ${otpCode}`);
    console.log(`==================================================\n`);
    return true;
  }
};
