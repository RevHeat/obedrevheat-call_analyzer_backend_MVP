import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = {
  context: QueryInterface;
};

export const up = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.addColumn("organizations", "stripe_customer_id", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("organizations", "stripe_subscription_id", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addIndex("organizations", ["stripe_customer_id"]);
  await queryInterface.addIndex("organizations", ["stripe_subscription_id"]);
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.removeIndex("organizations", ["stripe_customer_id"]);
  await queryInterface.removeIndex("organizations", ["stripe_subscription_id"]);

  await queryInterface.removeColumn("organizations", "stripe_customer_id");
  await queryInterface.removeColumn("organizations", "stripe_subscription_id");
};
