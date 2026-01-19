import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelizeSetup";

export class RefreshToken extends Model {
  declare id: string;
  declare user_id: string;
  declare token_hash: string;
  declare expires_at: Date;
  declare revoked_at: Date | null;
  declare replaced_by_token_id: string | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

RefreshToken.init(
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
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    replaced_by_token_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "refresh_tokens",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["expires_at"] },
      { fields: ["revoked_at"] },
      { unique: true, fields: ["token_hash"] },
    ],
  }
);
