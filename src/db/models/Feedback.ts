import { DataTypes, Model } from "sequelize";
import { sequelize } from "../sequelizeSetup";
import { FeedbackAttributes, FeedbackCreationAttributes } from "../../types/feedback.types";

export class Feedback
  extends Model<FeedbackAttributes, FeedbackCreationAttributes>
  implements FeedbackAttributes
{
  declare id: string;

  declare created_by_user_id: string;

  declare type: FeedbackAttributes["type"];
  declare message: string;
  declare rating: number | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Feedback.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    created_by_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    type: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "feedback",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
