const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function sendMail() {
  const args = process.argv.slice(2);
  const toEmail = args[0] || 'admin@tulsimart.com';
  const otpCode = args[1] || '123456';
  const recipientName = args[2] || 'Store Admin';

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_HOST_USER || '';
  const rawPass = (process.env.EMAIL_HOST_PASSWORD || '').replace(/^["']|["']$/g, '').trim();
  const pass = rawPass.replace(/\s+/g, '');
  const fromEmail = user ? `"Tulsi Mart Supermarket" <${user}>` : '"Tulsi Mart Security" <noreply@tulsimart.com>';

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
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Standard Nodemailer Transport mode (JSON/Console Transport)
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
  }

  // Find project logo
  const logoPaths = [
    path.join(__dirname, '../frontend/public/logo-transparent.png'),
    path.join(__dirname, '../frontend/public/logo.png'),
    path.join(__dirname, '../logo.png'),
    path.join(__dirname, 'logo.png')
  ];

  let actualLogoPath = null;
  for (const p of logoPaths) {
    if (fs.existsSync(p)) {
      actualLogoPath = p;
      break;
    }
  }

  let logoBase64 = '';
  if (actualLogoPath) {
    try {
      logoBase64 = `data:image/png;base64,${fs.readFileSync(actualLogoPath).toString('base64')}`;
    } catch (e) {
      console.warn('Failed to read logo file for base64:', e.message);
    }
  }

  const digits = (otpCode || '123456').padStart(6, '0').split('');
  
  // Compact 6-Digit Non-Wrapping Table Cells
  const digitsCellsHtml = digits.map(d => `
    <td align="center" valign="middle" style="padding: 0 3px; width: 36px; white-space: nowrap;">
      <table border="0" cellpadding="0" cellspacing="0" style="width: 36px; height: 48px; background-color: #1e293b; border: 2px solid #88BDF2; border-radius: 10px; border-collapse: separate; box-shadow: 0 4px 12px rgba(136, 189, 242, 0.25);">
        <tr>
          <td align="center" valign="middle" style="font-family: 'JetBrains Mono', 'Courier New', Courier, monospace; font-size: 24px; font-weight: 900; color: #88BDF2; text-align: center; line-height: 48px;">
            ${d}
          </td>
        </tr>
      </table>
    </td>
  `).join('');

  const logoHtml = actualLogoPath 
    ? `<img src="cid:logo_img" alt="Tulsi Mart Logo" style="height: 52px; width: auto; max-width: 170px; display: block; margin: 0 auto 12px auto; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));" />`
    : (logoBase64 ? `<img src="${logoBase64}" alt="Tulsi Mart Logo" style="height: 52px; width: auto; max-width: 170px; display: block; margin: 0 auto 12px auto; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));" />` : `<div style="font-size: 32px; margin-bottom: 8px;">🛒</div>`);

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tulsi Mart Security OTP</title>
      <style>
        body { font-family: 'Plus Jakarta Sans', 'Segoe UI', system-ui, -apple-system, Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 25px 10px; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.4); border: 1px solid #1e293b; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #384959 50%, #273440 100%); padding: 32px 24px; text-align: center; color: #ffffff; position: relative; border-bottom: 3px solid #88BDF2; }
        .brand-badge { display: inline-block; background: rgba(136, 189, 242, 0.15); border: 1px solid rgba(136, 189, 242, 0.4); color: #88BDF2; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; padding: 4px 14px; border-radius: 50px; margin-bottom: 12px; }
        .brand-title { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; margin: 0; color: #ffffff; }
        .brand-subtitle { font-size: 12px; color: #BDDDFC; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-top: 6px; }
        .content { padding: 30px 24px; color: #334155; }
        .greeting { font-size: 17px; font-weight: 800; color: #384959; margin-bottom: 8px; }
        .intro-text { font-size: 14px; line-height: 1.6; color: #64748b; margin-bottom: 22px; }
        .otp-container { background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%); border-radius: 20px; padding: 24px 12px; text-align: center; box-shadow: inset 0 2px 4px rgba(255,255,255,0.05), 0 10px 25px rgba(15,23,42,0.25); border: 1px solid #334155; margin: 24px 0; border-top: 3px solid #88BDF2; }
        .otp-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; color: #94a3b8; margin-bottom: 16px; }
        .timer-badge { display: inline-block; margin-top: 18px; background: rgba(136, 189, 242, 0.12); border: 1px solid rgba(136, 189, 242, 0.3); color: #88BDF2; font-size: 12px; font-weight: 700; padding: 5px 16px; border-radius: 30px; }
        .warning-box { background: #f0f7ff; border-left: 4px solid #384959; padding: 14px 16px; border-radius: 12px; font-size: 12px; color: #384959; margin-top: 24px; line-height: 1.5; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          ${logoHtml}
          <div class="brand-badge">🔒 2FA Verification</div>
          <h1 class="brand-title">Tulsi Mart</h1>
          <div class="brand-subtitle">Supermarket & Grocery Management</div>
        </div>

        <div class="content">
          <div class="greeting">Hello ${recipientName},</div>
          <div class="intro-text">
            A login authorization request was submitted for your <strong>Tulsi Mart</strong> account. Use the 6-digit security code below to complete your sign-in:
          </div>

          <div class="otp-container">
            <div class="otp-label">Security Verification Code</div>

            <!-- Single Non-Wrapping Row 6-Digit Box Layout -->
            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto; width: auto; border-collapse: separate; table-layout: fixed; white-space: nowrap;">
              <tr style="white-space: nowrap;">
                ${digitsCellsHtml}
              </tr>
            </table>

            <div class="timer-badge">⏱️ Valid for 10 Minutes</div>
          </div>

          <div class="warning-box">
            🛡️ <strong>Security Tip:</strong> Never share this OTP code with anyone. Tulsi Mart personnel will never ask for your 2FA verification code via phone or email.
          </div>
        </div>

        <div class="footer">
          &copy; 2026 Tulsi Mart Supermarket Software • Automated Security Notification
        </div>
      </div>
    </body>
    </html>
  `;

  const attachmentsList = [];
  if (actualLogoPath) {
    attachmentsList.push({
      filename: 'logo.png',
      path: actualLogoPath,
      cid: 'logo_img'
    });
  }

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: '🔒 Tulsi Mart 2FA Login Security OTP Code',
    text: `Hello ${recipientName},\n\nYour 6-digit OTP code for Tulsi Mart login is: ${otpCode}\n\nValid for 10 minutes.`,
    html: htmlTemplate,
    attachments: attachmentsList
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
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }));
    process.exit(1);
  }
}

sendMail();

