// src/constants/billing.ts

export const PLAN_KEYS = {
  TRIAL: "trial",
  SOLO: "solo",
  TEAM_5: "team_5",
  TEAM_10: "team_10",
  ENTERPRISE: "enterprise",
} as const;

export type PlanKey = (typeof PLAN_KEYS)[keyof typeof PLAN_KEYS];

export const SUBSCRIPTION_STATUSES = {
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  EXPIRED: "expired",
  LIFETIME: "lifetime",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];

// Seats per plan (null = unlimited / enterprise)
export const PLAN_SEATS_LIMIT: Record<PlanKey, number | null> = {
  [PLAN_KEYS.TRIAL]: 1, // change to 5 if you want team trials
  [PLAN_KEYS.SOLO]: 1,
  [PLAN_KEYS.TEAM_5]: 5,
  [PLAN_KEYS.TEAM_10]: 10,
  [PLAN_KEYS.ENTERPRISE]: null,
};

// 7-day grace period for past_due status
export const PAST_DUE_GRACE_DAYS = 7;

// Access source values
export const ACCESS_SOURCES = {
  STRIPE: "stripe",
  WHOP: "whop",
  BOTH: "both",
} as const;

// Central rule: can this org use the product?
export function isSubscriptionAllowed(args: {
  subscription_status: string | null | undefined;
  trial_ends_at: Date | string | null | undefined;
  past_due_since?: Date | string | null | undefined;
  access_source?: string | null | undefined;
}) {
  const { subscription_status, trial_ends_at, past_due_since, access_source } = args;

  // Whop-sourced access: trust the synced status from webhooks
  if (access_source === ACCESS_SOURCES.WHOP || access_source === ACCESS_SOURCES.BOTH) {
    if (subscription_status === SUBSCRIPTION_STATUSES.ACTIVE) return true;
    if (subscription_status === SUBSCRIPTION_STATUSES.LIFETIME) return true;
    // For "both", fall through to Stripe logic as fallback
    if (access_source === ACCESS_SOURCES.BOTH) {
      // continue to Stripe checks below
    } else {
      // Whop-only: if not active, deny
      return false;
    }
  }

  // Stripe / direct logic (original)
  if (subscription_status === SUBSCRIPTION_STATUSES.LIFETIME) return true;

  if (subscription_status === SUBSCRIPTION_STATUSES.ACTIVE) return true;

  if (subscription_status === SUBSCRIPTION_STATUSES.TRIALING) {
    if (!trial_ends_at) return false;
    const end = trial_ends_at instanceof Date ? trial_ends_at : new Date(trial_ends_at);
    return end.getTime() > Date.now();
  }

  if (subscription_status === SUBSCRIPTION_STATUSES.PAST_DUE) {
    if (!past_due_since) return true; // no recorded date → allow (freshly transitioned)
    const since = past_due_since instanceof Date ? past_due_since : new Date(past_due_since);
    const gracePeriodMs = PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - since.getTime() < gracePeriodMs;
  }

  return false;
}
