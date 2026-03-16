import crypto from "crypto";
import { Op, Transaction } from "sequelize";
import argon2 from "argon2";
import Stripe from "stripe";

import { sequelize } from "../db/sequelizeSetup";
import { PurchaseSetupToken } from "../db/models/PurchaseSetupToken";
import { User } from "../db/models/User";
import { Organization } from "../db/models/Organization";
import { OrganizationMember } from "../db/models/OrganizationMember";
import { EmailService } from "./email.service";
import { PLAN_KEYS, SUBSCRIPTION_STATUSES, PLAN_SEATS_LIMIT } from "../constants/billing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const FRONTEND_URL = process.env.APP_URL || "http://localhost:3000";
const LIFETIME_PRICE_ID = process.env.STRIPE_LIFETIME_PRICE_ID || "";
const SETUP_TOKEN_EXPIRY_DAYS = 7;

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

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function ensureUniqueOrgSlug(baseSlug: string, t: Transaction) {
  const slug = baseSlug || "workspace";

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;

    const exists = await Organization.findOne({
      where: { slug: candidate },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!exists) return candidate;
  }

  throw new Error("Could not generate a unique workspace slug");
}

export default class PurchaseSetupService {
  /**
   * Called from webhook when checkout.session.completed with mode=payment
   */
  static async handleOneTimePayment(session: any) {
    // Verify this payment is for our lifetime product
    if (LIFETIME_PRICE_ID) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id;
        if (priceId && priceId !== LIFETIME_PRICE_ID) {
          console.log("[PurchaseSetup] Price ID mismatch, skipping", { priceId, expected: LIFETIME_PRICE_ID });
          return;
        }
      } catch (err: any) {
        console.warn("[PurchaseSetup] Could not verify price ID, proceeding anyway", err?.message);
      }
    }

    const email = (
      session.customer_details?.email ||
      session.customer_email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      console.warn("[PurchaseSetup] No email found in session", session.id);
      return;
    }

    const sessionId = session.id;

    // Idempotency: skip if already processed
    const existing = await PurchaseSetupToken.findOne({
      where: { stripe_checkout_session_id: sessionId },
    });
    if (existing) {
      console.log("[PurchaseSetup] Session already processed, skipping", sessionId);
      return;
    }

    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id || null;

    const stripePaymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await PurchaseSetupService.upgradeExistingUser(existingUser, stripeCustomerId);
      // Still record the token for audit (marked as used immediately)
      const rawToken = crypto.randomBytes(32).toString("hex");
      await PurchaseSetupToken.create({
        email,
        plan_key: PLAN_KEYS.SOLO,
        stripe_checkout_session_id: sessionId,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_intent_id: stripePaymentIntentId,
        token_hash: sha256(rawToken),
        expires_at: new Date(Date.now() + SETUP_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        used_at: new Date(),
      });
      return;
    }

    // Revoke previous unused tokens for same email
    await PurchaseSetupToken.update(
      { used_at: new Date() },
      {
        where: {
          email,
          used_at: null,
        },
      }
    );

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + SETUP_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await PurchaseSetupToken.create({
      email,
      plan_key: PLAN_KEYS.SOLO,
      stripe_checkout_session_id: sessionId,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_intent_id: stripePaymentIntentId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Send welcome email
    const setupUrl = `${FRONTEND_URL}/setup-account?token=${rawToken}`;
    await EmailService.sendWelcomeSetupEmail({ to: email, setupUrl });

    console.log("[PurchaseSetup] Setup token created and email sent", { email, sessionId });
  }

  /**
   * Called from webhook when checkout.session.completed with metadata.flow === "public_checkout"
   */
  static async handlePublicSubscription(session: any) {
    const email = (
      session.customer_details?.email ||
      session.customer_email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      console.warn("[PurchaseSetup] No email found in public subscription session", session.id);
      return;
    }

    const sessionId = session.id;
    const planKey = session.metadata?.plan_key || PLAN_KEYS.SOLO;
    const interval = session.metadata?.interval || "monthly";

    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id || null;

    const stripeSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null;

    // Idempotency: skip if already processed
    const existing = await PurchaseSetupToken.findOne({
      where: { stripe_checkout_session_id: sessionId },
    });
    if (existing) {
      console.log("[PurchaseSetup] Public subscription session already processed, skipping", sessionId);
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await PurchaseSetupService.upgradeExistingUserSubscription(
        existingUser,
        stripeCustomerId,
        stripeSubscriptionId,
        planKey,
        interval
      );
      // Record token for audit (marked as used immediately)
      const rawToken = crypto.randomBytes(32).toString("hex");
      await PurchaseSetupToken.create({
        email,
        plan_key: planKey,
        stripe_checkout_session_id: sessionId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        billing_interval: interval,
        token_hash: sha256(rawToken),
        expires_at: new Date(Date.now() + SETUP_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        used_at: new Date(),
      });
      return;
    }

    // Revoke previous unused tokens for same email
    await PurchaseSetupToken.update(
      { used_at: new Date() },
      { where: { email, used_at: null } }
    );

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + SETUP_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await PurchaseSetupToken.create({
      email,
      plan_key: planKey,
      stripe_checkout_session_id: sessionId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      billing_interval: interval,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Send welcome email
    const setupUrl = `${FRONTEND_URL}/setup-account?token=${rawToken}`;
    await EmailService.sendWelcomeSetupEmail({ to: email, setupUrl });

    console.log("[PurchaseSetup] Public subscription token created and email sent", {
      email,
      sessionId,
      planKey,
      interval,
    });
  }

  /**
   * Validate a setup token (for GET endpoint)
   */
  static async validateToken(rawToken: string) {
    if (!rawToken) {
      throw new HttpError(400, "TOKEN_REQUIRED", "Setup token is required.");
    }

    const tokenHash = sha256(rawToken);
    const now = new Date();

    const record = await PurchaseSetupToken.findOne({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: { [Op.gt]: now },
      },
    });

    if (!record) {
      throw new HttpError(400, "INVALID_TOKEN", "This setup link is invalid or has expired.");
    }

    return { email: record.email };
  }

  /**
   * Complete account setup (for POST endpoint)
   */
  static async completeSetup(params: {
    token: string;
    fullName: string;
    password: string;
  }) {
    const token = (params.token || "").trim();
    const fullName = (params.fullName || "").trim();
    const password = params.password || "";

    if (!token) throw new HttpError(400, "TOKEN_REQUIRED", "Setup token is required.");
    if (!fullName) throw new HttpError(400, "NAME_REQUIRED", "Full name is required.");
    if (!password || password.length < 8) {
      throw new HttpError(400, "WEAK_PASSWORD", "Password must be at least 8 characters.");
    }

    const tokenHash = sha256(token);
    const now = new Date();

    return sequelize.transaction(async (txn) => {
      const record = await PurchaseSetupToken.findOne({
        where: {
          token_hash: tokenHash,
          used_at: null,
          expires_at: { [Op.gt]: now },
        },
        transaction: txn,
        lock: txn.LOCK.UPDATE,
      });

      if (!record) {
        throw new HttpError(400, "INVALID_TOKEN", "This setup link is invalid or has expired.");
      }

      const email = record.email.trim().toLowerCase();

      // Check if user was created between payment and setup
      let user = await User.findOne({
        where: { email },
        transaction: txn,
        lock: txn.LOCK.UPDATE,
      });

      if (user) {
        // User created in the meantime — upgrade their org and mark token used
        await record.update({ used_at: now }, { transaction: txn });
        await PurchaseSetupService.upgradeExistingUserInTxn(user, record.stripe_customer_id, txn);
        return {
          ok: true,
          email: user.email,
          user: { id: user.id, email: user.email },
        };
      }

      // Create user
      const password_hash = await argon2.hash(password);
      user = await User.create(
        { email, full_name: fullName, password_hash },
        { transaction: txn }
      );

      // Create organization
      const orgName = `${fullName}'s Workspace`;
      const slug = await ensureUniqueOrgSlug(slugify(orgName), txn);

      // Determine org fields based on whether this is a subscription or lifetime token
      const isSubscription = !!record.stripe_subscription_id;
      const seatsLimit = PLAN_SEATS_LIMIT[record.plan_key as keyof typeof PLAN_SEATS_LIMIT] ?? 1;

      const org = await Organization.create(
        {
          name: orgName,
          slug,
          created_by_user_id: user.id,
          plan_key: record.plan_key,
          subscription_status: isSubscription
            ? SUBSCRIPTION_STATUSES.ACTIVE
            : SUBSCRIPTION_STATUSES.LIFETIME,
          billing_interval: isSubscription ? (record.billing_interval as "monthly" | "annual") : null,
          trial_ends_at: null,
          current_period_end: null,
          seats_limit: seatsLimit,
          stripe_customer_id: record.stripe_customer_id,
          stripe_subscription_id: record.stripe_subscription_id || undefined,
        },
        { transaction: txn }
      );

      // Create org membership
      await OrganizationMember.create(
        {
          org_id: org.id,
          user_id: user.id,
          role: "admin",
          status: "active",
        },
        { transaction: txn }
      );

      // Mark token used
      await record.update({ used_at: now }, { transaction: txn });

      return {
        ok: true,
        email: user.email,
        user: { id: user.id, email: user.email },
      };
    });
  }

  /**
   * Upgrade an existing user's org with a subscription (called from public checkout webhook)
   */
  private static async upgradeExistingUserSubscription(
    user: User,
    stripeCustomerId: string | null,
    stripeSubscriptionId: string | null,
    planKey: string,
    interval: string
  ) {
    return sequelize.transaction(async (txn) => {
      const membership = await OrganizationMember.findOne({
        where: { user_id: user.id, role: "admin" },
        transaction: txn,
      });

      if (!membership) {
        console.warn("[PurchaseSetup] No admin org found for user", user.email);
        return;
      }

      const org = await Organization.findByPk(membership.org_id, {
        transaction: txn,
        lock: txn.LOCK.UPDATE,
      });

      if (!org) return;

      const seatsLimit = PLAN_SEATS_LIMIT[planKey as keyof typeof PLAN_SEATS_LIMIT] ?? 1;

      await org.update(
        {
          plan_key: planKey,
          subscription_status: SUBSCRIPTION_STATUSES.ACTIVE,
          billing_interval: interval as "monthly" | "annual",
          trial_ends_at: null,
          seats_limit: seatsLimit,
          cancel_at_period_end: false,
          past_due_since: null,
          stripe_customer_id: stripeCustomerId || org.stripe_customer_id,
          stripe_subscription_id: stripeSubscriptionId || org.stripe_subscription_id,
        },
        { transaction: txn }
      );

      const loginUrl = `${FRONTEND_URL}/login`;
      await EmailService.sendPurchaseConfirmationEmail({ to: user.email, loginUrl });

      console.log("[PurchaseSetup] Upgraded existing user subscription", {
        email: user.email,
        org_id: org.id,
        planKey,
        interval,
      });
    });
  }

  /**
   * Upgrade an existing user's org to lifetime (called from webhook)
   */
  private static async upgradeExistingUser(user: User, stripeCustomerId: string | null) {
    return sequelize.transaction(async (txn) => {
      await PurchaseSetupService.upgradeExistingUserInTxn(user, stripeCustomerId, txn);
    });
  }

  /**
   * Upgrade within an existing transaction
   */
  private static async upgradeExistingUserInTxn(
    user: User,
    stripeCustomerId: string | null,
    txn: Transaction
  ) {
    // Find org where user is admin
    const membership = await OrganizationMember.findOne({
      where: { user_id: user.id, role: "admin" },
      transaction: txn,
    });

    if (!membership) {
      console.warn("[PurchaseSetup] No admin org found for user", user.email);
      return;
    }

    const org = await Organization.findByPk(membership.org_id, {
      transaction: txn,
      lock: txn.LOCK.UPDATE,
    });

    if (!org) return;

    // Skip if already lifetime
    if (org.subscription_status === SUBSCRIPTION_STATUSES.LIFETIME) {
      console.log("[PurchaseSetup] Org already lifetime, skipping upgrade", org.id);
      return;
    }

    await org.update(
      {
        plan_key: PLAN_KEYS.SOLO,
        subscription_status: SUBSCRIPTION_STATUSES.LIFETIME,
        billing_interval: null,
        trial_ends_at: null,
        current_period_end: null,
        seats_limit: 1,
        cancel_at_period_end: false,
        past_due_since: null,
        stripe_customer_id: stripeCustomerId || org.stripe_customer_id,
      },
      { transaction: txn }
    );

    // Send confirmation email
    const loginUrl = `${FRONTEND_URL}/login`;
    await EmailService.sendPurchaseConfirmationEmail({ to: user.email, loginUrl });

    console.log("[PurchaseSetup] Upgraded existing user to lifetime", {
      email: user.email,
      org_id: org.id,
    });
  }
}
