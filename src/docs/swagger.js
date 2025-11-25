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
    // For Vercel/serverless: Use CDN assets to avoid static file serving issues
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    
    const swaggerUiOptions = {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "BidRoom API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
      },
    };
    
    // Use CDN assets on Vercel to avoid static file serving issues
    if (isVercel) {
      swaggerUiOptions.customJs = [
        "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js",
        "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js",
      ];
      swaggerUiOptions.customCssUrl = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css";
    }
    
    // Serve dynamic OpenAPI spec with current server URL
    app.get("/api-docs/swagger.json", (req, res) => {
      const docCopy = JSON.parse(JSON.stringify(swaggerDocument));
      
      // Get the base URL from the request
      const protocol = req.protocol || (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
      const host = req.get('host') || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      // Update servers array with dynamic URL
      docCopy.servers = [
        {
          url: `${baseUrl}/api/v1`,
          description: process.env.VERCEL ? 'Vercel deployment' : 'Current server'
        },
        {
          url: "http://localhost:5000/api/v1",
          description: "Development server (local)"
        }
      ];
      
      res.setHeader("Content-Type", "application/json");
      res.send(docCopy);
    });
    
    // Setup Swagger UI to use the dynamic spec endpoint
    const finalOptions = {
      ...swaggerUiOptions,
      swaggerOptions: {
        ...swaggerUiOptions.swaggerOptions,
        url: "/api-docs/swagger.json", // Use the dynamic spec endpoint
      },
    };
    
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(null, finalOptions));

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
