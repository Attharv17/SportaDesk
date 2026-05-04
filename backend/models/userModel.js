const { query, pool } = require('../config/db');

/** Find a user by email (includes password_hash for auth). */
const findByEmail = async (email) => {
  const { rows } = await query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

/** Find a user by ID (excludes password_hash). */
const findById = async (id) => {
  const { rows } = await query(
    'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

/** Insert a new user and return the created row (no password_hash). */
const create = async ({ name, email, passwordHash, role }) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );
    const [rows] = await conn.execute(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    return rows[0];
  } finally {
    conn.release();
  }
};

module.exports = { findByEmail, findById, create };
