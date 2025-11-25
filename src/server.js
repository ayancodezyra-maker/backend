import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables FIRST
dotenv.config();

// Import utilities (after dotenv.config)
import { validateEnv } from "./utils/validateEnv.js";
import logger, { requestLogger, errorLogger } from "./utils/logger.js";
import { swaggerSetup } from "./docs/swagger.js";

// Validate environment variables at startup
validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & Rate Limiting Middleware
import {
  checkBlockedIp,
  ddosDetector,
  globalRateLimiter,
  createRateLimiter,
} from "./middlewares/rateLimit.js";

app.use(checkBlockedIp);
app.use(ddosDetector);
app.use(globalRateLimiter);

// CORS Configuration (Production-ready)
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : process.env.NODE_ENV === 'production'
    ? false // Deny all in production if not configured
    : '*', // Allow all in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Request parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Serve static files from backend directory
app.use(express.static(path.join(__dirname, "..")));

// Serve reset-password.html at /reset-password route
app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "reset-password.html"));
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Backend API Server",
    data: {
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      endpoints: {
        health: "/api/health",
        api: "/api/v1",
        documentation: process.env.NODE_ENV !== 'production' ? "/api-docs" : null,
      },
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// API Documentation (Swagger)
if (process.env.NODE_ENV !== 'production') {
  swaggerSetup(app);
  logger.info('Swagger documentation available at /api-docs');
}

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import projectRoutes from "./projects/projectRoutes.js";
import milestoneRoutes from "./milestones/milestoneRoutes.js";
import bidRoutes from "./bids/bidRoutes.js";
import jobRoutes from "./jobs/jobRoutes.js";
import paymentRoutes from "./payments/paymentRoutes.js";
import payoutRoutes from "./payments/payoutRoutes.js";
import contractorRoutes from "./contractors/contractorRoutes.js";
import conversationRoutes from "./conversations/conversationRoutes.js";
import messageRoutes from "./conversations/messageRoutes.js";
import notificationRoutes from "./notifications/notificationRoutes.js";
import progressUpdateRoutes from "./progress/progressUpdateRoutes.js";
import reviewRoutes from "./reviews/reviewRoutes.js";
import disputeRoutes from "./disputes/disputeRoutes.js";

// API Versioning - Register routes under /api/v1
const v1Router = express.Router();

// Register Routes with versioning
v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);
v1Router.use("/admin", adminRoutes);
v1Router.use("/projects", projectRoutes);
v1Router.use("/milestones", milestoneRoutes);
v1Router.use("/bids", bidRoutes);
v1Router.use("/jobs", jobRoutes);
v1Router.use("/payments", paymentRoutes);
v1Router.use("/payouts", payoutRoutes);
v1Router.use("/contractors", contractorRoutes);
v1Router.use("/conversations", conversationRoutes);
v1Router.use("/messages", messageRoutes);
v1Router.use("/notifications", notificationRoutes);
v1Router.use("/progress-updates", progressUpdateRoutes);
v1Router.use("/reviews", reviewRoutes);
v1Router.use("/disputes", disputeRoutes);

// Mount versioned routes
app.use("/api/v1", v1Router);

// Backward compatibility - also mount at /api (deprecated)
app.use("/api", v1Router);

// Error handling middleware
app.use(errorLogger);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: {
      path: req.path,
      method: req.method,
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    data: process.env.NODE_ENV === 'production' ? null : { stack: err.stack },
  });
});

// Export app for Vercel serverless functions
export default app;

// Start server only if not running on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    logger.info(`🚀 Backend server running on port ${PORT}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    logger.info(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
  });
}
