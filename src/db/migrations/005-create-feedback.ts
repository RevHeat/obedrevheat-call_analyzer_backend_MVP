import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = { context: QueryInterface };

export const up = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.createTable("feedback", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    created_by_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    type: {
      type: DataTypes.STRING(32),
      allowNull: false, // bug | review | idea | question | other
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    rating: {
      type: DataTypes.INTEGER,
      allowNull: true, // only for review
    },

    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("feedback", ["created_by_user_id", "created_at"]);
  await queryInterface.addIndex("feedback", ["type", "created_at"]);
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.dropTable("feedback");
};
