import { QueryInterface, DataTypes } from "sequelize";

type MigrationContext = {
  context: QueryInterface;
};

export async function up({ context: queryInterface }: MigrationContext) {
  await queryInterface.addColumn("organizations", "billing_interval", {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

export async function down({ context: queryInterface }: MigrationContext) {
  await queryInterface.removeColumn("organizations", "billing_interval");
}
