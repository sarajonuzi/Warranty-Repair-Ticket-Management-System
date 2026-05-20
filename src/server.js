const createApp = require("./app");
const { initDatabase } = require("./db/database");
const { port } = require("./config");

async function start() {
  await initDatabase();
  const app = createApp();

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
