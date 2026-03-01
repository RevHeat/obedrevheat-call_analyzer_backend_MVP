import { QueryInterface, DataTypes } from "sequelize";

type MigrationContext = {
  context: QueryInterface;
};

export async function up({ context: queryInterface }: MigrationContext) {
  await queryInterface.addColumn("organizations", "cancel_at_period_end", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn("organizations", "past_due_since", {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down({ context: queryInterface }: MigrationContext) {
  await queryInterface.removeColumn("organizations", "cancel_at_period_end");
  await queryInterface.removeColumn("organizations", "past_due_since");
}
