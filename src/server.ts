import "dotenv/config";
import app from "./app";
import { sequelize } from "./db/sequelizeSetup";
import { setupAssociations } from "./db/models/associations";


const PORT = Number(process.env.PORT || 4000);

(async () => {
  try {
    console.log("DB ENV =>", {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_SSL: process.env.DB_SSL,
    });

     setupAssociations();

    await sequelize.authenticate();
    console.log("DB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("DB connection failed", err);
    process.exit(1);
  }
})();
