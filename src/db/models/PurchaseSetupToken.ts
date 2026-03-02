import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelizeSetup";

export class PurchaseSetupToken extends Model {
  declare id: string;
  declare email: string;
  declare plan_key: string;
  declare stripe_checkout_session_id: string;
  declare stripe_customer_id: string | null;
  declare stripe_payment_intent_id: string | null;
  declare token_hash: string;
  declare expires_at: Date;
  declare used_at: Date | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

PurchaseSetupToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plan_key: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "solo",
    },
    stripe_checkout_session_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripe_payment_intent_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "purchase_setup_tokens",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["email"] },
      { fields: ["expires_at"] },
      { unique: true, fields: ["token_hash"] },
    ],
  }
);

export default PurchaseSetupToken;
