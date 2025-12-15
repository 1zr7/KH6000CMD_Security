const { Pool } = require('pg');
const config = require('./config');
const pool = new Pool(config.db);

(async () => {
    try {
        console.log('Fixing DB...');
        const nurseRes = await pool.query("SELECT id FROM users WHERE role='nurse' LIMIT 1");
        if (nurseRes.rows.length === 0) {
            console.log('No nurse found');
            process.exit(1);
        }
        const nurseId = nurseRes.rows[0].id;
        console.log('Found Nurse ID:', nurseId);

        await pool.query('UPDATE doctors SET assigned_nurse_id = $1', [nurseId]);
        console.log('Updated doctors table successfully.');
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
