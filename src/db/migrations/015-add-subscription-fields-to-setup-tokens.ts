import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = { context: QueryInterface };

export const up = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.addColumn("purchase_setup_tokens", "stripe_subscription_id", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("purchase_setup_tokens", "billing_interval", {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.removeColumn("purchase_setup_tokens", "stripe_subscription_id");
  await queryInterface.removeColumn("purchase_setup_tokens", "billing_interval");
};
