/**
 * Swagger/OpenAPI 3.1 Documentation Loader
 * Loads and serves OpenAPI specification from YAML file
 */
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup Swagger UI with OpenAPI 3.1 specification
 * @param {Express} app - Express application instance
 */
export const swaggerSetup = (app) => {
  try {
    // Load OpenAPI YAML file from backend root
    const swaggerDocumentPath = path.join(__dirname, "..", "..", "openapi.yaml");
    const swaggerDocument = YAML.load(swaggerDocumentPath);

    // Validate that document loaded successfully
    if (!swaggerDocument || !swaggerDocument.openapi) {
      throw new Error("Invalid OpenAPI specification file");
    }

    // Setup Swagger UI with explorer enabled
    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "BidRoom API Documentation",
      })
    );

    console.log("✅ Swagger UI loaded successfully from openapi.yaml");
    return swaggerDocument;
  } catch (error) {
    console.error("❌ Failed to load Swagger documentation:", error.message);
    console.error("Error details:", error);
    
    // Don't crash the server, just log the error
    app.use("/api-docs", (req, res) => {
      res.status(500).json({
        success: false,
        message: "API documentation is currently unavailable",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    });
    
    return null;
  }
};

export default swaggerSetup;
