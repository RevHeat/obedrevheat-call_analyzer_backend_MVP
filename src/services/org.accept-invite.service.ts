import crypto from "crypto";
import { Op } from "sequelize";
import argon2 from "argon2";

import { sequelize } from "../db/sequelizeSetup";

import OrganizationInvite from "../db/models/OrganizationInvite";
import { OrganizationMember } from "../db/models/OrganizationMember";
import { User } from "../db/models/User";
import { Organization } from "../db/models/Organization";


class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalize(value: any) {
  return String(value || "").trim();
}

function normalizePlan(value: any) {
  return String(value || "").trim().toLowerCase();
}


const SEATS_BY_PLAN: Record<string, number> = {
  free: 1,
  starter: 3,
  pro: 10,
  business: 10,
  enterprise: 999999,
};

export default class OrgAcceptInviteService {
  static async acceptInviteAndRegister(params: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    const token = normalize(params.token);
    const firstName = normalize(params.firstName);
    const lastName = normalize(params.lastName);
    const password = String(params.password || "");

    if (!token) throw new HttpError(400, "TOKEN_REQUIRED", "Invite token is required.");
    if (!firstName) throw new HttpError(400, "FIRST_NAME_REQUIRED", "First name is required.");
    if (!lastName) throw new HttpError(400, "LAST_NAME_REQUIRED", "Last name is required.");
    if (!password || password.length < 8) {
      throw new HttpError(400, "WEAK_PASSWORD", "Password must be at least 8 characters.");
    }

    const tokenHash = sha256(token);
    const now = new Date();

    return sequelize.transaction(async (txn) => {
      // 1) Find valid invite (lock row to avoid double-accept)
      const invite = await OrganizationInvite.findOne({
        where: {
          token_hash: tokenHash,
          accepted_at: null,
          revoked_at: null,
          expires_at: { [Op.gt]: now },
        },
        transaction: txn,
        lock: txn.LOCK.UPDATE,
      });

      if (!invite) {
        throw new HttpError(400, "INVALID_INVITE", "This invite is invalid or has expired.");
      }

      // 2) Load org + determine seat limit by fixed plan mapping
      const org = await Organization.findByPk(invite.org_id, {
        transaction: txn,
        lock: txn.LOCK.KEY_SHARE,
      });

      if (!org) {
        throw new HttpError(400, "ORG_NOT_FOUND", "Organization not found for this invite.");
      }

      // Prefer DB truth from billing sync: seats_limit / plan_key
      const seatsLimitFromDb = (org as any).seats_limit;

      // If null => unlimited, if number => enforce
      const seatLimit =
        seatsLimitFromDb === null
          ? null
          : Number(seatsLimitFromDb ?? 1); // fallback to 1 if missing

      // 3) Seat validation happens HERE (source of truth)
      const activeMembers = await OrganizationMember.count({
        where: { org_id: invite.org_id, status: "active" },
        transaction: txn,
      });

        if (seatLimit !== null && activeMembers >= seatLimit) {
        throw new HttpError(
          409,
          "SEAT_LIMIT_REACHED",
          "This organization has reached its seat limit. Ask an admin to upgrade."
        );
      }

      // 4) Create or reuse user (email comes from invite)
      const email = String(invite.email || "").trim().toLowerCase();
      if (!email) {
        throw new HttpError(400, "INVITE_EMAIL_MISSING", "Invite email is missing.");
      }

      let user = await User.findOne({ where: { email }, transaction: txn, lock: txn.LOCK.UPDATE });

      if (user) {
        // Re-validate "cannot join if admin elsewhere"
        const adminElsewhere = await OrganizationMember.findOne({
          where: {
            user_id: user.id,
            role: "admin",
            org_id: { [Op.ne]: invite.org_id },
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

        // If already in this org, block
        const alreadyInOrg = await OrganizationMember.findOne({
          where: { org_id: invite.org_id, user_id: user.id },
          transaction: txn,
        });

        if (alreadyInOrg) {
          throw new HttpError(409, "ALREADY_IN_ORG", "This user is already part of the organization.");
        }

        // We DO NOT reset password here (security). If you want that, do explicit reset flow.
      } else {
        const password_hash = await argon2.hash(password);

            user = await User.create(
            {
                email,
                full_name: `${firstName} ${lastName}`.trim(),
                password_hash,
            },
            { transaction: txn }
            );

      }

      // 5) Create membership (active)
      await OrganizationMember.create(
        {
          org_id: invite.org_id,
          user_id: user.id,
          role: invite.role,
          status: "active",
        },
        { transaction: txn }
      );

      // 6) Mark invite as accepted
      await invite.update({ accepted_at: now }, { transaction: txn });

      return {
        ok: true,
        org_id: invite.org_id,
        user: { id: user.id, email: user.email },
      };
    });
  }
}
