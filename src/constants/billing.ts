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

// Central rule: can this org use the product?
export function isSubscriptionAllowed(args: {
  subscription_status: string | null | undefined;
  trial_ends_at: Date | string | null | undefined;
}) {
  const { subscription_status, trial_ends_at } = args;

  if (subscription_status === SUBSCRIPTION_STATUSES.ACTIVE) return true;

  if (subscription_status === SUBSCRIPTION_STATUSES.TRIALING) {
    if (!trial_ends_at) return false;
    const end = trial_ends_at instanceof Date ? trial_ends_at : new Date(trial_ends_at);
    return end.getTime() > Date.now();
  }

  return false;
}
