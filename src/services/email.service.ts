import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;

if (!SES_FROM_EMAIL) {
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

  static async sendOrgInviteEmail(params: {
    to: string;
    inviteUrl: string;
    orgName: string;
  }) {
    const { to, inviteUrl, orgName } = params;

    if (!SES_FROM_EMAIL) {
      throw new Error("SES_FROM_EMAIL is not configured");
    }

    const subject = `You're invited to join ${orgName} on RevHeat`;

    const textBody = [
      `You’ve been invited to join ${orgName} on RevHeat.`,
      "",
      "Accept your invite:",
      inviteUrl,
      "",
      "If you weren’t expecting this invite, you can ignore this email.",
    ].join("\n");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>You’ve been invited to join <strong>${orgName}</strong> on RevHeat.</p>
        <p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;text-decoration:none;">
            Accept invite
          </a>
        </p>
        <p style="word-break: break-all;">Or paste this link in your browser:<br/>${inviteUrl}</p>
        <p>If you weren’t expecting this invite, you can ignore this email.</p>
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

  static async sendWelcomeSetupEmail(params: { to: string; setupUrl: string }) {
    const { to, setupUrl } = params;

    if (!SES_FROM_EMAIL) {
      throw new Error("SES_FROM_EMAIL is not configured");
    }

    const subject = "Thank you for your purchase! Set up your account";

    const textBody = [
      "Thank you for purchasing RevHeat Call Analyzer!",
      "",
      "Set up your account using this link (valid for 7 days):",
      setupUrl,
      "",
      "If you have any questions, reply to this email.",
    ].join("\n");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>Thank you for purchasing <strong>RevHeat Call Analyzer</strong>!</p>
        <p>Click the button below to set up your account:</p>
        <p>
          <a href="${setupUrl}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#8f3eba;color:#ffffff;text-decoration:none;font-weight:600;">
            Set up your account
          </a>
        </p>
        <p style="word-break: break-all;">Or paste this link in your browser:<br/>${setupUrl}</p>
        <p style="color:#666;">This link is valid for 7 days.</p>
        <p>If you have any questions, reply to this email.</p>
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

  static async sendPurchaseConfirmationEmail(params: { to: string; loginUrl: string }) {
    const { to, loginUrl } = params;

    if (!SES_FROM_EMAIL) {
      throw new Error("SES_FROM_EMAIL is not configured");
    }

    const subject = "Your account has been upgraded to Lifetime access";

    const textBody = [
      "Great news! Your RevHeat Call Analyzer account has been upgraded to Lifetime Solo access.",
      "",
      "Log in to your account:",
      loginUrl,
      "",
      "If you have any questions, reply to this email.",
    ].join("\n");

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <p>Great news! Your <strong>RevHeat Call Analyzer</strong> account has been upgraded to <strong>Lifetime Solo</strong> access.</p>
        <p>
          <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:#8f3eba;color:#ffffff;text-decoration:none;font-weight:600;">
            Log in to your account
          </a>
        </p>
        <p style="word-break: break-all;">Or paste this link in your browser:<br/>${loginUrl}</p>
        <p>If you have any questions, reply to this email.</p>
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
