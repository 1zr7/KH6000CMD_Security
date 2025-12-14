const db = require('../db');

const logEvent = async (action, actorId, details) => {
    try {
        const query = 'INSERT INTO audit_log (action, actor_id, details) VALUES ($1, $2, $3)';
        await db.query(query, [action, actorId, JSON.stringify(details)]);
    } catch (err) {
        console.error('Audit Log Failed:', err); // Fallback: log to console if DB fails
    }
};

module.exports = { logEvent };
