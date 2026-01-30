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

  // Billing
  declare plan_key?: string | null;
  declare subscription_status?: string | null;
  declare trial_ends_at?: Date | null;
  declare current_period_end?: Date | null;
  declare seats_limit?: number | null;

  declare created_at?: Date;
  declare updated_at?: Date;
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

    // ===== Billing / Subscription (NEW) =====
    plan_key: {
      type: DataTypes.STRING,
      allowNull: true,
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

    // timestamps (if you already have them explicitly in your model)
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
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
