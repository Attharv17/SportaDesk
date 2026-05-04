const { query } = require('../config/db');

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
// Returns aggregated stats for the authenticated organizer.
// Response shape matches frontend's DashboardStats interface:
// { activeTournaments, totalMatches, totalTeams, revenueEstimate }
const getStats = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         COUNT(DISTINCT t.id)                                                       AS "totalTournaments",
         COUNT(DISTINCT CASE WHEN t.status IN ('live', 'upcoming') THEN t.id END)   AS "activeTournaments",
         COUNT(DISTINCT m.id)                                                       AS "totalMatches",
         COUNT(DISTINCT tt.team_id)                                                 AS "totalTeams"
       FROM tournaments t
       LEFT JOIN matches          m  ON m.tournament_id  = t.id
       LEFT JOIN tournament_teams tt ON tt.tournament_id = t.id
       WHERE t.organizer_id = ?`,
      [req.user.id]
    );

    const s = rows[0] || {};

    res.json({
      activeTournaments: parseInt(s.activeTournaments,  10) || 0,
      totalMatches:      parseInt(s.totalMatches,       10) || 0,
      totalTeams:        parseInt(s.totalTeams,         10) || 0,
      totalTournaments:  parseInt(s.totalTournaments,   10) || 0,
      revenueEstimate:   '₹0',   // extend with real entry-fee sum later
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
