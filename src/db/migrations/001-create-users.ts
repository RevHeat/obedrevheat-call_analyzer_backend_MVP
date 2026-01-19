import { QueryInterface, DataTypes } from "sequelize";

type UmzugContext = { context: QueryInterface };

export const up = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.createTable("users", {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    auth0_user_id: { type: DataTypes.STRING, allowNull: true, unique: true },

    email: { type: DataTypes.STRING, allowNull: false, unique: true },

    password_hash: { type: DataTypes.STRING, allowNull: false },

    email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    full_name: { type: DataTypes.STRING, allowNull: true },
    avatar_url: { type: DataTypes.STRING, allowNull: true },
    last_seen_at: { type: DataTypes.DATE, allowNull: true },

    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });


};

export const down = async ({ context: queryInterface }: UmzugContext) => {
  await queryInterface.dropTable("users");
};
