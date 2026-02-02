// src/services/billing.service.ts
import Organization from "../db/models/Organization";
import { isSubscriptionAllowed, PLAN_KEYS, SUBSCRIPTION_STATUSES, PLAN_SEATS_LIMIT } from "../constants/billing";

type BillingState = {
  org_id: string;
  plan_key: string | null;
  subscription_status: string | null;
  trial_ends_at: Date | null;
  current_period_end: Date | null;
  seats_limit: number | null;
  allowed: boolean;
  is_trial: boolean;
  trial_days_left: number;
  billing_required: boolean;
};

function daysLeft(trialEndsAt: Date | null) {
  if (!trialEndsAt) return 0;
  const ms = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export class BillingService {
  async getBillingState(orgId: string): Promise<BillingState> {

    //Find user organization ID
    const org = await Organization.findByPk(orgId);
    if (!org) throw new Error("ORG_NOT_FOUND");

    const trialEnds = org.trial_ends_at ? new Date(org.trial_ends_at) : null;

    const allowed = isSubscriptionAllowed({
      subscription_status: org.subscription_status,
      trial_ends_at: org.trial_ends_at,
    });

    const isTrial = org.subscription_status === SUBSCRIPTION_STATUSES.TRIALING;
            return {
            org_id: org.id,
            plan_key: org.plan_key ?? null,
            subscription_status: org.subscription_status ?? null,
            trial_ends_at: trialEnds,
            current_period_end: org.current_period_end ? new Date(org.current_period_end) : null,
            seats_limit: org.seats_limit ?? null,
            allowed,
            is_trial: isTrial,
            trial_days_left: isTrial ? daysLeft(trialEnds) : 0,
            billing_required: !allowed,
            };
  }

  // Placeholder ahora, Stripe  después
  async createCheckoutSession(orgId: string, userId: string, planKey: string) {
    const allowedTargets = [PLAN_KEYS.SOLO, PLAN_KEYS.TEAM_5, PLAN_KEYS.TEAM_10];
    if (!allowedTargets.includes(planKey as any)) throw new Error("INVALID_PLAN_KEY");

    const org = await Organization.findByPk(orgId);
    if (!org) throw new Error("ORG_NOT_FOUND");

    // TODO: Stripe Checkout Session real
    return { url: `/dashboard/billing?pending_upgrade=${encodeURIComponent(planKey)}` };
  }

  async createBillingPortalSession(orgId: string) {
    const org = await Organization.findByPk(orgId);
    if (!org) throw new Error("ORG_NOT_FOUND");

    // TODO: Stripe Billing Portal real
    return { url: `/dashboard/billing` };
  }

  async handleStripeWebhook(_rawBody: Buffer, _signature: string | undefined) {
    // TODO: stripe.webhooks.constructEvent + sync org
    return;
  }
}
