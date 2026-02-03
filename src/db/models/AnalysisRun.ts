import { DataTypes, Model } from "sequelize"
import { sequelize } from "../sequelizeSetup"

export type AnalysisRunStatus = "done" | "failed"

export type AnalysisRunAttributes = {
  id: string
  org_id: string
  user_id: string
  module: string
  overall_score: number | null
  result_json: Record<string, unknown>
  status: AnalysisRunStatus
  error_json: Record<string, unknown> | null
}

export type AnalysisRunCreationAttributes = Omit<AnalysisRunAttributes, "id"> & {
  id?: string
}

export class AnalysisRun
  extends Model<AnalysisRunAttributes, AnalysisRunCreationAttributes>
  implements AnalysisRunAttributes
{
  declare id: string
  declare org_id: string
  declare user_id: string
  declare module: string
  declare overall_score: number | null
  declare result_json: Record<string, unknown>
  declare status: AnalysisRunStatus
  declare error_json: Record<string, unknown> | null

  declare readonly created_at: Date
  declare readonly updated_at: Date
}

AnalysisRun.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    module: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    overall_score: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },

    result_json: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("done", "failed"),
      allowNull: false,
      defaultValue: "done",
    },

    error_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "analysis_runs",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
