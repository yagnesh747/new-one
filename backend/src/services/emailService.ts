import nodemailer from 'nodemailer';

const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'emperoryagnesh@gmail.com';

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
    return null;
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

    console.log(`[Email Notification Triggered] Target: ${NOTIFICATION_EMAIL}`);
    console.log(`[Email Content]\nSubject: ${subject}\n${textContent}`);

    try {
      const transporter = this.getTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Stockly Portal" <noreply@stockly.com>`,
          to: NOTIFICATION_EMAIL,
          subject,
          text: textContent,
        });
        console.log(`[Email Service] Registration email successfully sent to ${NOTIFICATION_EMAIL}`);
      } else {
        console.log(
          `[Email Service] SMTP credentials not provided in .env (SMTP_HOST, SMTP_USER, SMTP_PASS). Email logged above.`
        );
      }
    } catch (err) {
      console.error(`[Email Service Error] Failed to send email to ${NOTIFICATION_EMAIL}:`, err);
    }
  }
}
