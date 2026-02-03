import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = { context: QueryInterface };

export const up = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.createTable("analysis_runs", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "organizations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },

    module: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    overall_score: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },

    // Guarda TODO el resultado del análisis (sin transcript)
    result_json: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    // Opcional pero recomendable (auditoría / fallos)
    status: {
      type: DataTypes.ENUM("done", "failed"),
      allowNull: false,
      defaultValue: "done",
    },

    error_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  // Índices para historial por org / módulo
  await queryInterface.addIndex("analysis_runs", ["org_id"]);
  await queryInterface.addIndex("analysis_runs", ["user_id"]);
  await queryInterface.addIndex("analysis_runs", ["module"]);

  // Para listados por fecha (historial)
  await queryInterface.addIndex("analysis_runs", ["org_id", "created_at"]);
  await queryInterface.addIndex("analysis_runs", ["org_id", "module", "created_at"]);
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.dropTable("analysis_runs");

  // Nota: al dropear la tabla, el ENUM suele quedar colgado en Postgres si no lo borras.
  // Si quieres limpiarlo (opcional), descomenta:
  // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_analysis_runs_status";');
};
