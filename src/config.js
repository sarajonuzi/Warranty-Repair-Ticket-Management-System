const path = require("path");

const rootDir = path.join(__dirname, "..");

module.exports = {
  port: process.env.PORT || 3000,
  databasePath: process.env.DATABASE_PATH || path.join(rootDir, "data", "repair_tickets.json"),
  jwtSecret: process.env.JWT_SECRET || "development-secret-change-before-production",
  rootDir
};
