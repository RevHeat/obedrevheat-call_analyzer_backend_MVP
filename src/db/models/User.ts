import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelizeSetup";
import {
  UserAttributes,
  UserCreationAttributes,
} from "../../types/user.types";

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare auth0_user_id: string;
  declare email: string;
  declare email_verified: boolean;
  declare full_name: string | null;
  declare avatar_url: string | null;
  declare last_seen_at: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    auth0_user_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    full_name: DataTypes.STRING,
    avatar_url: DataTypes.STRING,
    last_seen_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "users",
    underscored: true,
    timestamps: true,
  }
);
