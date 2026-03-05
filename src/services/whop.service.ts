import Whop from "@whop/sdk";
import { sequelize } from "../db/sequelizeSetup";
import { User } from "../db/models/User";
import { Organization } from "../db/models/Organization";
import { OrganizationMember } from "../db/models/OrganizationMember";
import {
  PLAN_KEYS,
  SUBSCRIPTION_STATUSES,
  PLAN_SEATS_LIMIT,
} from "../constants/billing";
import crypto from "crypto";

// Webhook key must be base64-encoded per Whop docs (Standard Webhooks spec)
const rawWebhookSecret = process.env.WHOP_WEBHOOK_SECRET || "";
const encodedWebhookKey = Buffer.from(rawWebhookSecret).toString("base64");

const whopClient = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  webhookKey: encodedWebhookKey,
  appID: process.env.WHOP_APP_ID,
});

export { whopClient };

/**
 * Verify a Whop user token from the x-whop-user-token header.
 * Returns { userId, appId } from the JWT payload.
 */
export async function verifyWhopUserToken(token: string) {
  return whopClient.verifyUserToken(token);
}

/**
 * Fetch Whop user profile by user ID.
 */
export async function getWhopUserInfo(whopUserId: string) {
  const user = await whopClient.users.retrieve(whopUserId);
  return {
    id: user.id,
    username: user.username,
    name: user.name,
  };
}

/**
 * Check if a Whop user has access to our product.
 */
export async function checkWhopAccess(
  whopUserId: string,
  resourceId?: string
) {
  const accessPassId =
    resourceId || process.env.WHOP_ACCESS_PASS_ID;
  if (!accessPassId) {
    throw new Error("WHOP_ACCESS_PASS_ID not configured");
  }
  const result = await whopClient.users.checkAccess(accessPassId, {
    id: whopUserId,
  });
  return result.has_access;
}

/**
 * Find or create a local user + org from a Whop user ID.
 * Auto-provisions on first visit from Whop iframe.
 *
 * Flow:
 * 1. Look up by whop_user_id → found → return
 * 2. Fetch profile from Whop API (username, name)
 * 3. Check if user with matching email exists → link whop_user_id
 * 4. Otherwise create new user + org + membership
 */
export async function findOrCreateWhopUser(whopUserId: string) {
  // 1. Already linked?
  const existing = await User.findOne({
    where: { whop_user_id: whopUserId },
  });

  if (existing) {
    const membership = await OrganizationMember.findOne({
      where: { user_id: existing.id, status: "active" },
      order: [["created_at", "ASC"]],
    });

    return {
      userId: existing.id,
      orgId: membership ? (membership as any).org_id : null,
      created: false,
    };
  }

  // 2. Fetch profile from Whop
  const whopUser = await getWhopUserInfo(whopUserId);

  // 3. Check if a user with matching email already exists (e.g. from Stripe/direct signup)
  //    Whop may expose email via API, or user may share email through Zapier flow
  const whopEmail = (whopUser as any).email as string | undefined;
  if (whopEmail) {
    const byEmail = await User.findOne({ where: { email: whopEmail } });
    if (byEmail) {
      // Link Whop identity to existing user
      byEmail.whop_user_id = whopUserId;
      byEmail.whop_username = whopUser.username;
      await byEmail.save();

      // Upgrade org access_source to "both" if it was "stripe"
      const membership = await OrganizationMember.findOne({
        where: { user_id: byEmail.id, status: "active" },
        order: [["created_at", "ASC"]],
      });
      if (membership) {
        const org = await Organization.findByPk((membership as any).org_id);
        if (org && org.access_source === "stripe") {
          org.access_source = "both";
          await org.save();
        }
      }

      return {
        userId: byEmail.id,
        orgId: membership ? (membership as any).org_id : null,
        created: false,
      };
    }
  }

  // 4. Create new user + org in transaction
  const placeholderHash = crypto.randomBytes(64).toString("hex");

  return await sequelize.transaction(async (t) => {
    const user = await User.create(
      {
        email: whopEmail || `${whopUserId}@whop.user`,
        password_hash: placeholderHash,
        email_verified: false,
        full_name: whopUser.name || whopUser.username,
        whop_user_id: whopUserId,
        whop_username: whopUser.username,
      },
      { transaction: t }
    );

    const slug = `whop-${whopUser.username || whopUserId}`.slice(0, 50);

    const org = await Organization.create(
      {
        name: whopUser.username || `Whop User`,
        slug,
        created_by_user_id: user.id,
        plan_key: PLAN_KEYS.SOLO,
        subscription_status: SUBSCRIPTION_STATUSES.ACTIVE,
        seats_limit: PLAN_SEATS_LIMIT[PLAN_KEYS.SOLO],
        access_source: "whop",
      },
      { transaction: t }
    );

    await OrganizationMember.create(
      {
        org_id: org.id,
        user_id: user.id,
        role: "admin",
        status: "active",
        joined_at: new Date(),
      },
      { transaction: t }
    );

    return {
      userId: user.id,
      orgId: org.id,
      created: true,
    };
  });
}
