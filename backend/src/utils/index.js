const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const queryDatabase = async (query, params) => {
    try {
        const res = await pool.query(query, params);
        return res.rows;
    } catch (err) {
        throw new Error('Database query failed: ' + err.message);
    }
};

const closeConnection = async () => {
    await pool.end();
};

module.exports = {
    queryDatabase,
    closeConnection,
};