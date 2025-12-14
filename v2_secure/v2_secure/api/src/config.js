require('dotenv').config();

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // SSL is required for Render/Neon in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Fallback for local development if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  dbConfig.user = process.env.DB_USER || 'postgres';
  dbConfig.host = process.env.DB_HOST || 'db';
  dbConfig.database = process.env.DB_NAME || 'healthcure';
  dbConfig.password = process.env.DB_PASSWORD || 'postgres';
  dbConfig.port = process.env.DB_PORT || 5432;
  delete dbConfig.connectionString;
  delete dbConfig.ssl;
}

module.exports = {
  port: process.env.PORT || 4000,
  db: dbConfig,
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
};
