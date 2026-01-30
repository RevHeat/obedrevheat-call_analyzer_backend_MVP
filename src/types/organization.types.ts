import { Optional } from "sequelize";

export type OrganizationAttributes = {
  id: string;
  name: string;
  slug: string;
  created_by_user_id?: string | null;

  // ===== Billing / Subscription =====
  plan_key?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: Date | null;
  current_period_end?: Date | null;
  seats_limit?: number | null;

  created_at?: Date;
  updated_at?: Date;
};

export type OrganizationCreationAttributes = Optional<
  OrganizationAttributes,
  | "id"
  | "created_by_user_id"
  | "plan_key"
  | "subscription_status"
  | "trial_ends_at"
  | "current_period_end"
  | "seats_limit"
  | "created_at"
  | "updated_at"
>;
