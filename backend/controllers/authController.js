const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const userModel = require('../models/userModel');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const formatUser = (u) => ({
  id:        u.id,
  name:      u.name,
  email:     u.email,
  role:      u.role,
  avatar:    u.avatar || null,
  createdAt: u.created_at,
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email, and password are required' });

    if (password.length < 4)
      return res.status(400).json({ error: 'Password must be at least 4 characters' });

    const existing = await userModel.findByEmail(email);
    if (existing)
      return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user         = await userModel.create({ name, email, passwordHash, role: role || 'player' });
    const token        = signToken(user);

    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await userModel.findByEmail(email);
    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = (_req, res) => {
  // Stateless JWT: client discards token.
  // Add refresh-token invalidation here if needed.
  res.json({ message: 'Logged out successfully' });
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const me = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(user));
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, me };
