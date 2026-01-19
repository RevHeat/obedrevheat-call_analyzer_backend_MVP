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
  declare created_by_user_id: string | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
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
  },
  {
    sequelize,
    tableName: "organizations",
    underscored: true,
    timestamps: true,

    indexes: [
      { unique: true, fields: ["slug"] },
      { fields: ["created_by_user_id"] },
    ],
  }
);
