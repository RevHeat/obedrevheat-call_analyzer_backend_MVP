import { QueryInterface, DataTypes } from "sequelize";
type UmzugContext = { context: QueryInterface };

export const up = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.createTable("organization_members", {
    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: { model: "organizations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
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
    joined_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex("organization_members", ["org_id"]);
  await queryInterface.addIndex("organization_members", ["user_id"]);
  await queryInterface.addIndex("organization_members", ["role"]);
  await queryInterface.addIndex("organization_members", ["status"]);
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.dropTable("organization_members");
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_organization_members_role";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_organization_members_status";');
};
