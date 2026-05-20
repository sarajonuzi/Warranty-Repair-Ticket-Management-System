const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const userRoutes = require("./routes/userRoutes");
const { authenticate, requireAdmin } = require("./middleware/authMiddleware");
const { swaggerUi, swaggerSpec } = require("./swagger");
const { rootDir } = require("./config");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(rootDir, "public")));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Warranty & Repair Ticket Management System" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/tickets", authenticate, ticketRoutes);
  app.use("/api/technicians", authenticate, technicianRoutes);
  app.use("/api/users", authenticate, requireAdmin, userRoutes);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use((req, res) => {
    res.status(404).json({ message: "Resource not found." });
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
      message: err.message || "Internal server error."
    });
  });

  return app;
}

module.exports = createApp;
