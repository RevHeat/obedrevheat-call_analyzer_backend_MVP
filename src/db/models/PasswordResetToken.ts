import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelizeSetup";
import { User } from "./User";

export class PasswordResetToken extends Model {
  declare id: string;
  declare user_id: string;
  declare token_hash: string;
  declare expires_at: Date;
  declare used_at: Date | null;

  declare user?: User;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
    tableName: "password_reset_tokens",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["expires_at"] },
      { fields: ["used_at"] },
      { unique: true, fields: ["token_hash"] },
    ],
  }
);
