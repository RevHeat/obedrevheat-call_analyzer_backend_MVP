import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelizeSetup";

export class OrganizationInvite extends Model {
  declare id: string;
  declare org_id: string;
  declare invited_by_user_id: string;

  declare email: string;
  declare role: "admin" | "member";

  declare token_hash: string;

  declare expires_at: Date;
  declare accepted_at: Date | null;
  declare revoked_at: Date | null;

  declare created_at: Date;
  declare updated_at: Date;
}

OrganizationInvite.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    invited_by_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    role: {
      type: DataTypes.ENUM("admin", "member"),
      allowNull: false,
      defaultValue: "member",
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

    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "organization_invites",
    timestamps: true,
    underscored: true,
  }
);

export default OrganizationInvite;
