import { Optional } from "sequelize";

export type OrganizationAttributes = {
  id: string;
  name: string;
  slug: string;
  created_by_user_id?: string | null;

  // ===== Billing / Subscription =====
  plan_key?: string | null;
  billing_interval?: "monthly" | "annual" | null;
  subscription_status?: string | null;
  trial_ends_at?: Date | null;
  current_period_end?: Date | null;
  seats_limit?: number | null;

  cancel_at_period_end?: boolean | null;
  past_due_since?: Date | null;

  // Stripe
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;

  // Whop
  whop_membership_id?: string | null;
  access_source?: string | null;

  created_at?: Date;
  updated_at?: Date;
};

export type OrganizationCreationAttributes = Optional<
  OrganizationAttributes,
  | "id"
  | "created_by_user_id"
  | "plan_key"
  | "billing_interval"
  | "subscription_status"
  | "trial_ends_at"
  | "current_period_end"
  | "seats_limit"
  | "cancel_at_period_end"
  | "past_due_since"
  | "stripe_customer_id"
  | "stripe_subscription_id"
  | "whop_membership_id"
  | "access_source"
  | "created_at"
  | "updated_at"
>;
