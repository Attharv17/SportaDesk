const matchModel = require('../models/matchModel');

// ─── GET /api/matches/live?tournamentId=<uuid> ────────────────────────────────
const getLiveMatches = async (req, res, next) => {
  try {
    const { tournamentId } = req.query;
    const matches = await matchModel.findLive(tournamentId || null);
    res.json({ data: matches });   // already serialized by model
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/matches/:id/score ───────────────────────────────────────────────
// Internal / admin endpoint to push a live score update.
// Body: { sport, homeScore, awayScore }
const updateScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sport, homeScore, awayScore } = req.body;

    if (!sport || homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ error: 'sport, homeScore, and awayScore are required' });
    }

    await matchModel.upsertScore(id, sport, homeScore, awayScore);
    const [updated] = await matchModel.findLive(null).then((ms) =>
      ms.filter((m) => m.id === id)
    );

    res.json({ data: updated || null });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/manager/matches ──────────────────────────────────────────────────
const getManagerMatches = async (req, res, next) => {
  try {
    const matches = await matchModel.findByManager(req.user.id);
    res.json({ data: matches });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLiveMatches, updateScore, getManagerMatches };
