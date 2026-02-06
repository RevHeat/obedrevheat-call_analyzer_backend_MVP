import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelizeSetup";
import {
  OrganizationAttributes,
  OrganizationCreationAttributes,
} from "../../types/organization.types";

export class Organization
  extends Model<OrganizationAttributes, OrganizationCreationAttributes>
  implements OrganizationAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare created_by_user_id?: string | null;

  // ===== Billing / Subscription =====
  declare plan_key?: string | null;
  declare billing_interval?: "monthly" | "annual" | null;
  declare subscription_status?: string | null;
  declare trial_ends_at?: Date | null;
  declare current_period_end?: Date | null;
  declare seats_limit?: number | null;

  // ===== Stripe =====
  declare stripe_customer_id?: string | null;
  declare stripe_subscription_id?: string | null;
}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    created_by_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    // ===== Billing / Subscription =====
    plan_key: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    billing_interval: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: {
          args: [["monthly", "annual"]],
          msg: "billing_interval must be 'monthly' or 'annual'",
        },
      },
    },

    subscription_status: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    current_period_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    seats_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // ===== Stripe =====
    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    stripe_subscription_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "organizations",
    timestamps: true,
    underscored: true,
  }
);

export default Organization;
