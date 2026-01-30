import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = {
  context: QueryInterface;
};

export const up = async ({ context: queryInterface }: UmzugContext) => {
  // 1) Add columns (nullable first, safe for prod)
  await queryInterface.addColumn("organizations", "plan_key", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("organizations", "subscription_status", {
    type: DataTypes.STRING,
    allowNull: true,
  });

  await queryInterface.addColumn("organizations", "trial_ends_at", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await queryInterface.addColumn("organizations", "current_period_end", {
    type: DataTypes.DATE,
    allowNull: true,
  });

  await queryInterface.addColumn("organizations", "seats_limit", {
    type: DataTypes.INTEGER,
    allowNull: true,
  });

  // 2) Backfill existing organizations
  await queryInterface.sequelize.query(`
    UPDATE organizations
    SET
      plan_key = COALESCE(plan_key, 'trial'),
      subscription_status = COALESCE(subscription_status, 'trialing'),
      trial_ends_at = COALESCE(trial_ends_at, NOW() + INTERVAL '14 days'),
      seats_limit = COALESCE(seats_limit, 1)
  `);
};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.removeColumn("organizations", "plan_key");
  await queryInterface.removeColumn("organizations", "subscription_status");
  await queryInterface.removeColumn("organizations", "trial_ends_at");
  await queryInterface.removeColumn("organizations", "current_period_end");
  await queryInterface.removeColumn("organizations", "seats_limit");
};
