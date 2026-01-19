import "dotenv/config";
import path from "path";
import { Umzug, SequelizeStorage } from "umzug";
import { sequelize } from "./sequelizeSetup";

export const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, "migrations", "*.{ts,js}"),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    const cmd = process.argv[2];

    if (cmd === "down") {
      await umzug.down({ step: 1 });
      console.log("Rolled back 1 migration");
      process.exit(0);
    }

    await umzug.up();
    console.log("Migrations applied");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
