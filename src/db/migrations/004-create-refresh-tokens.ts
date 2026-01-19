import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = { context: QueryInterface };

export const up = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.createTable("refresh_tokens", {
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
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    replaced_by_token_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "refresh_tokens", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.addIndex("refresh_tokens", ["user_id"]);
  await queryInterface.addIndex("refresh_tokens", ["expires_at"]);
  await queryInterface.addIndex("refresh_tokens", ["revoked_at"]);
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.dropTable("refresh_tokens");
};
