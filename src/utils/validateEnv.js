/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 */
import { z } from 'zod';
import logger from './logger.js';

// Define environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('5000'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).optional(),
  CORS_ORIGIN: z.string().optional(), // Can be comma-separated URLs or '*'
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).optional(),
});

/**
 * Validate environment variables
 */
export const validateEnv = () => {
  try {
    const env = envSchema.parse(process.env);
    logger.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError && error.errors) {
      logger.error('Environment validation failed:', {
        errors: error.errors.map((e) => ({
          path: e.path ? e.path.join('.') : 'unknown',
          message: e.message || 'Validation error',
        })),
      });
      console.error('\n❌ Environment Variable Validation Failed:');
      error.errors.forEach((err) => {
        const path = err.path ? err.path.join('.') : 'unknown';
        console.error(`  - ${path}: ${err.message || 'Validation error'}`);
      });
      console.error('\nPlease check your .env file and ensure all required variables are set.\n');
      process.exit(1);
    } else {
      // Handle non-Zod errors
      logger.error('Environment validation failed with unexpected error:', {
        error: error.message || String(error),
        stack: error.stack,
      });
      console.error('\n❌ Environment Variable Validation Failed:');
      console.error(`  Error: ${error.message || String(error)}`);
      console.error('\nPlease check your .env file and ensure all required variables are set.\n');
      process.exit(1);
    }
  }
};

/**
 * Get validated environment variables
 */
export const getEnv = () => {
  return envSchema.parse(process.env);
};

// Note: validateEnv() should be called explicitly in server.js after dotenv.config()
// We don't auto-validate on import to avoid issues

