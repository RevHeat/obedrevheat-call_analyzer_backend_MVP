import { Sequelize } from "sequelize";

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL,
  DB_SSL_REJECT_UNAUTHORIZED,
} = process.env;

export const sequelize = new Sequelize(DB_NAME!, DB_USER!, DB_PASSWORD!, {
  host: DB_HOST,
  port: Number(DB_PORT || 5432),
  dialect: "postgres",
  logging: process.env.NODE_ENV === "production" ? false : false,

  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },

  dialectOptions:
    DB_SSL === "true"
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: (DB_SSL_REJECT_UNAUTHORIZED ?? "false") === "true",
          },
        }
      : undefined,
});
