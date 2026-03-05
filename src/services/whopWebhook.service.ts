import { User } from "../db/models/User";
import { Organization } from "../db/models/Organization";
import { OrganizationMember } from "../db/models/OrganizationMember";
import { sequelize } from "../db/sequelizeSetup";
import {
  PLAN_KEYS,
  SUBSCRIPTION_STATUSES,
  PLAN_SEATS_LIMIT,
  ACCESS_SOURCES,
} from "../constants/billing";
import type Whop from "@whop/sdk";

type MembershipData = Whop.Membership;

/**
 * Map Whop product/plan to our internal plan_key.
 * Override this mapping based on your Whop Access Pass IDs.
 */
function mapWhopToPlanKey(_membership: MembershipData): string {
  // Default to solo — customize when you set up multiple Access Passes in Whop
  return PLAN_KEYS.SOLO;
}

/**
 * Handle membership.activated webhook event.
 * Creates or updates user + org when a Whop membership becomes active.
 */
export async function handleMembershipActivated(membership: MembershipData) {
  const whopUserId = membership.user?.id;
  if (!whopUserId) {
    console.warn("membership.activated: no user ID in payload");
    return;
  }

  const planKey = mapWhopToPlanKey(membership);

  // Check if user already exists
  let user = await User.findOne({ where: { whop_user_id: whopUserId } });

  if (user) {
    // Update existing user's org
    const membershipRecord = await OrganizationMember.findOne({
      where: { user_id: user.id, status: "active" },
      order: [["created_at", "ASC"]],
    });

    if (membershipRecord) {
      const orgId = (membershipRecord as any).org_id;
      const org = await Organization.findByPk(orgId);
      if (org) {
        const newSource =
          org.access_source === ACCESS_SOURCES.STRIPE
            ? ACCESS_SOURCES.BOTH
            : ACCESS_SOURCES.WHOP;

        await org.update({
          subscription_status: SUBSCRIPTION_STATUSES.ACTIVE,
          plan_key: planKey,
          seats_limit: PLAN_SEATS_LIMIT[planKey as keyof typeof PLAN_SEATS_LIMIT] ?? 1,
          whop_membership_id: membership.id,
          access_source: newSource,
          current_period_end: membership.renewal_period_end
            ? new Date(membership.renewal_period_end)
            : null,
          past_due_since: null,
        });
      }
    }
    return;
  }

  // New user — create via transaction
  await sequelize.transaction(async (t) => {
    const username = membership.user?.username || whopUserId;

    user = await User.create(
      {
        email: `${whopUserId}@whop.user`,
        password_hash: require("crypto").randomBytes(64).toString("hex"),
        email_verified: false,
        full_name: membership.user?.name || username,
        whop_user_id: whopUserId,
        whop_username: username,
      },
      { transaction: t }
    );

    const slug = `whop-${username}`.slice(0, 50);

    const org = await Organization.create(
      {
        name: username,
        slug,
        created_by_user_id: user.id,
        plan_key: planKey,
        subscription_status: SUBSCRIPTION_STATUSES.ACTIVE,
        seats_limit: PLAN_SEATS_LIMIT[planKey as keyof typeof PLAN_SEATS_LIMIT] ?? 1,
        whop_membership_id: membership.id,
        access_source: ACCESS_SOURCES.WHOP,
        current_period_end: membership.renewal_period_end
          ? new Date(membership.renewal_period_end)
          : null,
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
  });
}

/**
 * Handle membership.deactivated webhook event.
 * Marks the org subscription as canceled if access is Whop-sourced.
 */
export async function handleMembershipDeactivated(membership: MembershipData) {
  const whopUserId = membership.user?.id;
  if (!whopUserId) return;

  const user = await User.findOne({ where: { whop_user_id: whopUserId } });
  if (!user) return;

  const membershipRecord = await OrganizationMember.findOne({
    where: { user_id: user.id, status: "active" },
    order: [["created_at", "ASC"]],
  });
  if (!membershipRecord) return;

  const org = await Organization.findByPk((membershipRecord as any).org_id);
  if (!org) return;

  if (org.access_source === ACCESS_SOURCES.WHOP) {
    await org.update({
      subscription_status: SUBSCRIPTION_STATUSES.CANCELED,
      whop_membership_id: null,
    });
  } else if (org.access_source === ACCESS_SOURCES.BOTH) {
    // Downgrade to Stripe-only — keep existing Stripe status
    await org.update({
      access_source: ACCESS_SOURCES.STRIPE,
      whop_membership_id: null,
    });
  }
}

/**
 * Handle payment.succeeded webhook event.
 */
export async function handlePaymentSucceeded(data: any) {
  const membershipId = data.membership_id;
  if (!membershipId) return;

  const org = await Organization.findOne({
    where: { whop_membership_id: membershipId },
  });
  if (!org) return;

  await org.update({
    past_due_since: null,
    subscription_status: SUBSCRIPTION_STATUSES.ACTIVE,
  });
}

/**
 * Handle payment.failed webhook event.
 */
export async function handlePaymentFailed(data: any) {
  const membershipId = data.membership_id;
  if (!membershipId) return;

  const org = await Organization.findOne({
    where: { whop_membership_id: membershipId },
  });
  if (!org) return;

  if (!org.past_due_since) {
    await org.update({
      subscription_status: SUBSCRIPTION_STATUSES.PAST_DUE,
      past_due_since: new Date(),
    });
  }
}
