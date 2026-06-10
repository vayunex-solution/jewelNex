"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordEmailTemplate = exports.verificationEmailTemplate = void 0;
// ─────────────────────────────────────────
// Email: Verify Your JewelNex Account
// ─────────────────────────────────────────
const verificationEmailTemplate = (name, otp) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f0f; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a; }
    .header { background: linear-gradient(135deg, #b8860b, #d4af37); padding: 32px; text-align: center; }
    .header h1 { color: #000; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; }
    .header p { color: #1a1a1a; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 36px; text-align: center; }
    .body h2 { color: #d4af37; font-size: 22px; margin-top: 0; }
    .body p { color: #ccc; line-height: 1.7; text-align: left; }
    .otp-box { display: inline-block; margin: 24px 0; padding: 16px 32px; background: #2a2a2a; color: #d4af37; border: 2px dashed #d4af37; border-radius: 8px; font-weight: 800; font-size: 32px; letter-spacing: 8px; text-align: center; }
    .footer { padding: 20px 36px; border-top: 1px solid #2a2a2a; text-align: center; }
    .footer p { color: #555; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💎 JewelNex</h1>
      <p>Powered by VayuNex Solution</p>
    </div>
    <div class="body">
      <h2 style="text-align: left;">Verify Your Email Address</h2>
      <p>Hello <strong style="color:#d4af37">${name}</strong>,</p>
      <p>Welcome to JewelNex! Please use the following One-Time Password (OTP) to verify your email address and activate your account.</p>
      
      <div class="otp-box">${otp}</div>
      
      <p style="font-size:13px; color:#777; text-align: center;">This OTP will expire in <strong>24 hours</strong>. If you did not create an account, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VayuNex Solution. All rights reserved.</p>
      <p><a href="https://www.vayunexsolution.com/" style="color:#d4af37; text-decoration:none;">www.vayunexsolution.com</a></p>
    </div>
  </div>
</body>
</html>`;
};
exports.verificationEmailTemplate = verificationEmailTemplate;
// ─────────────────────────────────────────
// Email: Reset Your JewelNex Password
// ─────────────────────────────────────────
const resetPasswordEmailTemplate = (name, otp) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f0f; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a; }
    .header { background: linear-gradient(135deg, #b8860b, #d4af37); padding: 32px; text-align: center; }
    .header h1 { color: #000; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; }
    .header p { color: #1a1a1a; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 36px; text-align: center; }
    .body h2 { color: #d4af37; font-size: 22px; margin-top: 0; }
    .body p { color: #ccc; line-height: 1.7; text-align: left; }
    .otp-box { display: inline-block; margin: 24px 0; padding: 16px 32px; background: #2a2a2a; color: #d4af37; border: 2px dashed #d4af37; border-radius: 8px; font-weight: 800; font-size: 32px; letter-spacing: 8px; text-align: center; }
    .warning { background: #2a1a1a; border-left: 4px solid #d44; padding: 12px 16px; border-radius: 4px; color: #f88; font-size: 13px; text-align: left; }
    .footer { padding: 20px 36px; border-top: 1px solid #2a2a2a; text-align: center; }
    .footer p { color: #555; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💎 JewelNex</h1>
      <p>Powered by VayuNex Solution</p>
    </div>
    <div class="body">
      <h2 style="text-align: left;">Reset Your Password</h2>
      <p>Hello <strong style="color:#d4af37">${name}</strong>,</p>
      <p>We received a request to reset your JewelNex password. Please use the following One-Time Password (OTP) to proceed:</p>
      
      <div class="otp-box">${otp}</div>
      
      <div class="warning" style="margin-top: 16px;">⚠️ This OTP will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email and your account will remain secure.</div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VayuNex Solution. All rights reserved.</p>
      <p><a href="https://www.vayunexsolution.com/" style="color:#d4af37; text-decoration:none;">www.vayunexsolution.com</a></p>
    </div>
  </div>
</body>
</html>`;
};
exports.resetPasswordEmailTemplate = resetPasswordEmailTemplate;
//# sourceMappingURL=templates.js.map