import fs from "fs";
import { Sequelize } from "sequelize";

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_SSL,
  DB_SSL_REJECT_UNAUTHORIZED,
  DB_SSL_CA_PATH, // <-- NUEVO: path a CA bundle PEM
} = process.env;

const sslEnabled = DB_SSL === "true";
const rejectUnauthorized = (DB_SSL_REJECT_UNAUTHORIZED ?? "true") === "true"; // default: true
const caPath = DB_SSL_CA_PATH?.trim();

const sslOptions =
  sslEnabled
    ? {
        require: true,
        rejectUnauthorized,
        ...(caPath
          ? { ca: fs.readFileSync(caPath, "utf8") }
          : {}),
      }
    : undefined;

export const sequelize = new Sequelize(DB_NAME!, DB_USER!, DB_PASSWORD!, {
  host: DB_HOST,
  port: Number(DB_PORT || 5432),
  dialect: "postgres",
  logging: false,

  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },

  dialectOptions: sslEnabled ? { ssl: sslOptions } : undefined,
});
