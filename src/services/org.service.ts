import crypto from "crypto";
import { Op, Transaction } from "sequelize";

import OrganizationInvite from "../db/models/OrganizationInvite";
import { OrganizationMember } from "../db/models/OrganizationMember";
import { User } from "../db/models/User";
import { EmailService } from "./email.service";

class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default class OrgService {
  static async createInvite(params: {
    orgId: string;
    invitedByUserId: string;
    email: string;
    role?: "admin" | "member";
    orgName?: string;
    transaction?: Transaction;
  }) {
    const { orgId, invitedByUserId } = params;
    const email = normalizeEmail(params.email);
    const role: "admin" | "member" = params.role || "member";
    const txn = params.transaction;

    if (!email) {
      throw new HttpError(400, "INVALID_EMAIL", "Email is required.");
    }

    const frontendBaseUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_WEB_URL ||
      process.env.PUBLIC_APP_URL ||
      "http://localhost:3000";

    const now = new Date();
    const expiresAt = addDays(now, 7);

    // If user exists, enforce rules
    const existingUser = await User.findOne({
      where: { email },
      transaction: txn,
    });

    if (existingUser) {
      // If user is already in THIS org -> cannot invite
      const alreadyInThisOrg = await OrganizationMember.findOne({
        where: {
          org_id: orgId,
          user_id: existingUser.id,
        },
        transaction: txn,
      });

      if (alreadyInThisOrg) {
        throw new HttpError(
          409,
          "ALREADY_IN_ORG",
          "This user is already part of your organization."
        );
      }

      // If user is admin in ANY OTHER org -> cannot invite
      const adminElsewhere = await OrganizationMember.findOne({
        where: {
          user_id: existingUser.id,
          role: "admin",
          org_id: { [Op.ne]: orgId },
        },
        transaction: txn,
      });

      if (adminElsewhere) {
        throw new HttpError(
          409,
          "USER_IS_ADMIN_ELSEWHERE",
          "This email belongs to an organization admin and cannot be invited."
        );
      }
    }

    // If there is an active invite already, revoke it and create a new one.
    // Reason: we store only token hash, so we cannot resend the original token.
    const existingInvite = await OrganizationInvite.findOne({
      where: {
        org_id: orgId,
        email,
        accepted_at: null,
        revoked_at: null,
        expires_at: { [Op.gt]: now },
      },
      order: [["created_at", "DESC"]],
      transaction: txn,
    });

    if (existingInvite) {
      await existingInvite.update({ revoked_at: now }, { transaction: txn });
    }

    const rawToken = generateToken();
    const tokenHash = sha256(rawToken);

    const invite = await OrganizationInvite.create(
      {
        org_id: orgId,
        invited_by_user_id: invitedByUserId,
        email,
        role,
        token_hash: tokenHash,
        expires_at: expiresAt,
        accepted_at: null,
        revoked_at: null,
      },
      { transaction: txn }
    );

    const inviteUrl = `${String(frontendBaseUrl).replace(/\/$/, "")}/invite?token=${encodeURIComponent(
      rawToken
    )}`;

    const orgName = params.orgName || "your organization";
    await EmailService.sendOrgInviteEmail({
      to: email,
      inviteUrl,
      orgName,
    });

    return {
      invite: {
        id: invite.id,
        org_id: invite.org_id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        created_at: invite.created_at,
      },
      inviteUrl,
    };
  }
}
