import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Inventory Service API",
      version: "1.0.0",
      description: "Проста система інвентаризації для обліку речей.",
    },
  },

  apis: ["./swagger/api-docs.js"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
