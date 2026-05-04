const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sportadesk',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Use promise-based wrapper for the pool
const promisePool = pool.promise();

// Verify connection on startup
promisePool.getConnection()
  .then((conn) => { console.log('✅ Connected to MySQL'); conn.release(); })
  .catch((err) => { console.error('❌ MySQL connection error:', err.message); process.exit(-1); });

/**
 * Execute a parameterised query.
 *  - SELECT  → { rows: RowDataPacket[] }
 *  - INSERT  → { rows: [], insertId: number }
 *  - UPDATE/DELETE → { rows: [], affectedRows: number }
 */
const query = async (sql, params = []) => {
  const [result] = await promisePool.execute(sql, params);
  return {
    rows:         Array.isArray(result) ? result : [],
    insertId:     result.insertId     ?? null,
    affectedRows: result.affectedRows ?? 0,
  };
};

// Export promisePool and custom query wrapper for backwards compatibility
module.exports = { pool: promisePool, query };
