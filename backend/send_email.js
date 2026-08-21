const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function sendMail() {
  const args = process.argv.slice(2);
  const toEmail = args[0] || 'admin@tulsimart.com';
  const otpCode = args[1] || '123456';
  const recipientName = args[2] || 'Store Admin';

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_HOST_USER || '';
  const pass = process.env.EMAIL_HOST_PASSWORD || '';
  const fromEmail = process.env.EMAIL_FROM || (user ? user : '"Tulsi Mart Security" <noreply@tulsimart.com>');

  let transporter;

  if (user && pass) {
    // Real SMTP Nodemailer configuration
    transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: {
        user: user,
        pass: pass,
      },
    });
  } else {
    // Standard Nodemailer Transport mode (JSON/Console Transport)
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
  }

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fb; margin: 0; padding: 20px; color: #384959; }
        .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 900; color: #384959; text-decoration: none; }
        .badge { background-color: #bdddfc; color: #384959; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 12px; margin-left: 6px; }
        .otp-box { background: linear-gradient(135deg, #384959 0%, #1e293b 100%); color: #88bdf2; border-radius: 14px; padding: 20px; text-align: center; margin: 25px 0; letter-spacing: 10px; font-size: 32px; font-weight: 900; font-family: monospace; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="logo">🌿 Tulsi Mart</span><span class="badge">Nodemailer 2FA</span>
        </div>
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>Your single-use 6-digit Security OTP code for logging into <strong>Tulsi Mart Admin & POS Portal</strong> is:</p>
        <div class="otp-box">${otpCode}</div>
        <p style="font-size: 12px; color: #64748b;">This OTP code is valid for 5 minutes. Do not share this code with anyone.</p>
        <div class="footer">
          Dispatched via Nodemailer Transport Service • Tulsi Mart Supermarket Software
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: '🔒 Tulsi Mart 2FA Login Security OTP Code',
    text: `Hello ${recipientName},\n\nYour 6-digit OTP code for Tulsi Mart login is: ${otpCode}\n\nValid for 5 minutes.`,
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(JSON.stringify({
      success: true,
      messageId: info.messageId || 'SENT_NODEMAILER',
      recipient: toEmail,
      otp: otpCode,
      mode: user ? 'REAL_SMTP_NODEMAILER' : 'NODEMAILER_TRANSPORT'
    }));
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

sendMail();
