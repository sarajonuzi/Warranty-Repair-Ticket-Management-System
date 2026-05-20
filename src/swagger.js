const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Warranty & Repair Ticket Management System API",
      version: "1.0.0",
      description: "REST API for managing warranty and repair tickets."
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server"
      }
    ]
  },
  apis: ["./src/routes/*.js"]
});

module.exports = {
  swaggerUi,
  swaggerSpec
};
