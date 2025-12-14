const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool(config.db);

// Test connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('DB Config:', {
            host: config.db.host,
            database: config.db.database,
            ssl: !!config.db.ssl
        });
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Database connected successfully');
    release();
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
