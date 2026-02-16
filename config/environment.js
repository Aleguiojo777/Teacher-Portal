/**
 * Environment Configuration
 * Centralized configuration for the Teacher Portal
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Database Configuration
  database: {
    path: process.env.DATABASE_PATH || './database/teacher_portal.db',
    type: process.env.DB_TYPE || 'sqlite',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '5'),
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change_this_secret_key',
    jwtExpiry: process.env.JWT_EXPIRY || '7d',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  // Feature Flags
  features: {
    enableRegistration: process.env.ENABLE_REGISTRATION === 'true',
  },

  // Validate required env variables
  validate() {
    const requiredVars = ['JWT_SECRET'];
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length > 0 && this.server.isProduction) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  },
};
