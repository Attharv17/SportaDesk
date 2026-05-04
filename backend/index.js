require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const authRoutes       = require('./routes/auth');
const tournamentRoutes = require('./routes/tournaments');
const matchRoutes      = require('./routes/matches');
const dashboardRoutes  = require('./routes/dashboard');

// Role-based route modules
const organizerRoutes  = require('./routes/organizer');
const managerRoutes    = require('./routes/manager');
const playerRoutes     = require('./routes/player');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow the Vite dev server (port 5173) and any production URL set in CLIENT_URL
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Body parser ──────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches',     matchRoutes);
app.use('/api/dashboard',   dashboardRoutes);

// Role-based namespaces
app.use('/api/organizer',   organizerRoutes);
app.use('/api/manager',     managerRoutes);
app.use('/api/player',      playerRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 SportaDesk backend running on http://localhost:${PORT}`);
  console.log(`   Client origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});
