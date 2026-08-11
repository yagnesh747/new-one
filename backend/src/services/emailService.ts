import nodemailer from 'nodemailer';

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'emperoryagnesh@gmail.com';

export class EmailService {
  private static async getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      return {
        transporter: nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        }),
        isTest: false,
      };
    }

    // Auto-fallback to Ethereal Test Account if no SMTP settings provided
    try {
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SMTP test account creation timeout')), 3000)
        ),
      ]);
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      return { transporter: testTransporter, isTest: true };
    } catch (e) {
      console.warn('[Email Service Warning] Unable to connect to test SMTP server:', (e as Error).message);
      return null;
    }
  }

  static async sendRegistrationNotification(user: { email: string; full_name: string; role: string }) {
    const subject = `[Stockly] New User Registration: ${user.full_name} (${user.email})`;
    const textContent = `
A new user registration has been created on Stockly.

Details:
- Full Name: ${user.full_name}
- Email: ${user.email}
- Role: ${user.role}
- Registration Time: ${new Date().toISOString()}

This is an automated notification sent to ${NOTIFICATION_EMAIL}.
    `.trim();

    console.log(`\n================ EMAIL NOTIFICATION ================`);
    console.log(`Target: ${NOTIFICATION_EMAIL}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${textContent}`);

    try {
      const result = await this.getTransporter();
      if (result && result.transporter) {
        const info = await result.transporter.sendMail({
          from: process.env.SMTP_FROM || `"Stockly Portal" <noreply@stockly.com>`,
          to: NOTIFICATION_EMAIL,
          subject,
          text: textContent,
        });

        if (result.isTest) {
          const previewUrl = nodemailer.getTestMessageUrl(info);
          console.log(`\n📬 Real SMTP credentials not in .env. Sent via Ethereal Test Email Server.`);
          console.log(`🔗 Click to view actual email online: ${previewUrl}`);
        } else {
          console.log(`\n✅ Email successfully sent to ${NOTIFICATION_EMAIL} via SMTP.`);
        }
      }
    } catch (err) {
      console.error(`❌ [Email Service Error] Failed to send email to ${NOTIFICATION_EMAIL}:`, err);
    }
    console.log(`====================================================\n`);
  }
}
