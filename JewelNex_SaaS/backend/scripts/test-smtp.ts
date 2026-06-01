import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly for script running at root or backend folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { sendMail } from '../src/utils/mailer';

async function main() {
  console.log('Sending UAT SMTP test email...');
  try {
    await sendMail({
      to: 'no-reply@vayunexsolution.com',
      subject: 'JewelNex v1.0 — UAT SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background: #fff;">
          <h2 style="color: #C9A84C; border-bottom: 2px solid #C9A84C; padding-bottom: 10px;">JewelNex SaaS v1.0</h2>
          <p style="font-size: 16px; color: #333;">This is a system-generated SMTP integration test mail for the <strong>Final UAT Acceptance Checklist</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f9f9f9;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Parameter</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Value</th>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Status</td>
              <td style="padding: 10px; border: 1px solid #ddd; color: green; font-weight: bold;">PASSED</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Environment</td>
              <td style="padding: 10px; border: 1px solid #ddd;">UAT Verification</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">Timestamp</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${new Date().toISOString()}</td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #888; margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
            Powered by VayuNex Solution
          </p>
        </div>
      `
    });
    console.log('✅ UAT SMTP test email sent successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ UAT SMTP test email failed:', error);
    process.exit(1);
  }
}

main();
