const playerModel = require('../models/playerModel');

/**
 * GET /api/player/profile
 * Returns the player's profile, linked team, teammates, and joined tournaments.
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await playerModel.findProfileByUserId(req.user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Player profile not found. Ask your manager to link your account to a team.' });
    }
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/player/matches
 * Returns all matches for the player's team, including status and scores.
 */
const getMatches = async (req, res, next) => {
  try {
    const matches = await playerModel.findMatchesByUserId(req.user.id);
    res.json({ data: matches });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, getMatches };
