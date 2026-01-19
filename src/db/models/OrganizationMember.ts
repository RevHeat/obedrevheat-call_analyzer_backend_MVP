import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelizeSetup";
import type {
  OrganizationMemberAttributes,
  OrganizationMemberCreationAttributes,
} from "../../types/organizationMember.types";

export class OrganizationMember
  extends Model<OrganizationMemberAttributes, OrganizationMemberCreationAttributes>
  implements OrganizationMemberAttributes
{
  declare org_id: string;
  declare user_id: string;

  declare role: "admin" | "member";
  declare status: "active" | "invited" | "disabled";

  declare joined_at: Date | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

OrganizationMember.init(
  {
    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },

    role: {
      type: DataTypes.ENUM("admin", "member"),
      allowNull: false,
      defaultValue: "member",
    },

    status: {
      type: DataTypes.ENUM("active", "invited", "disabled"),
      allowNull: false,
      defaultValue: "active",
    },

    joined_at: {
      type: DataTypes.DATE,
      allowNull: true,
     
    },
  },
  {
    sequelize,
    tableName: "organization_members",
    underscored: true,
    timestamps: true,

    indexes: [
      { fields: ["org_id"] },
      { fields: ["user_id"] },
      { fields: ["role"] },
      { fields: ["status"] },
    ],
  }
);
