import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;

if (!SES_FROM_EMAIL) {
  // Esto falla rápido si te falta la env
  console.warn("[EmailService] Missing SES_FROM_EMAIL env var");
}

const ses = new SESClient({ region: AWS_REGION });

export class EmailService {
  static async sendPasswordResetEmail(params: { to: string; resetUrl: string }) {
    const { to, resetUrl } = params;

    if (!SES_FROM_EMAIL) {
      throw new Error("SES_FROM_EMAIL is not configured");
    }

    const subject = "Reset your RevHeat password";

    const textBody = [
      "We received a request to reset your RevHeat password.",
      "",
      `Reset your password using this link (valid for a limited time):`,
      resetUrl,
      "",
      "If you did not request this, you can safely ignore this email.",
    ].join("\n");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>We received a request to reset your RevHeat password.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;text-decoration:none;">
            Reset password
          </a>
        </p>
        <p style="word-break: break-all;">Or paste this link in your browser:<br/>${resetUrl}</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    const command = new SendEmailCommand({
      Source: SES_FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: textBody, Charset: "UTF-8" },
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    });

        try {
        await ses.send(command);
        } catch (err: any) {
        console.error("SES send error:", err?.name, err?.message);
        throw err;
        }
  }
}
