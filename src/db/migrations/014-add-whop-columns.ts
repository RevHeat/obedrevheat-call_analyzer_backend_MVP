import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = { context: QueryInterface };

export const up = async ({ context: queryInterface }: UmzugContext) => {
  // Users table
  await queryInterface.addColumn("users", "whop_user_id", {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  });
  await queryInterface.addColumn("users", "whop_username", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  // Organizations table
  await queryInterface.addColumn("organizations", "whop_membership_id", {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn("organizations", "access_source", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "stripe",
  });
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.removeColumn("users", "whop_user_id");
  await queryInterface.removeColumn("users", "whop_username");
  await queryInterface.removeColumn("organizations", "whop_membership_id");
  await queryInterface.removeColumn("organizations", "access_source");
};
