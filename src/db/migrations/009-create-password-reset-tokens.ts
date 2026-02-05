import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = { context: QueryInterface };

export const up = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.createTable("password_reset_tokens", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex("password_reset_tokens", ["user_id"]);
  await queryInterface.addIndex("password_reset_tokens", ["expires_at"]);
  await queryInterface.addIndex("password_reset_tokens", ["used_at"]);
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.dropTable("password_reset_tokens");
};
