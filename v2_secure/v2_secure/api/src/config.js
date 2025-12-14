require('dotenv').config();

const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_QKtZdaVU5Mc1@ep-broad-salad-ahtbkxfc-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
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
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 465,
    user: process.env.EMAIL_USER || '1ahmedzr7@gmail.com',
    pass: process.env.EMAIL_PASS || 'dhhp ggdx kgkb rlwj',
  },
};
