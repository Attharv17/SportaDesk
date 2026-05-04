const tournamentModel = require('../models/tournamentModel');

// ─── Serializers (exact shape the frontend expects) ────────────────────────────

const serializePlayer = (p) => ({
  id:           p.id,
  name:         p.name,
  position:     p.position     || null,
  jerseyNumber: p.jerseyNumber || p.jersey_number || null,
});

const serializeTeam = (t) => ({
  id:           t.id,
  name:         t.name,
  logo:         t.logo          || null,
  color:        t.color,
  players:      Array.isArray(t.players) ? t.players.map(serializePlayer) : [],
  wins:         t.wins          || 0,
  losses:       t.losses        || 0,
  draws:        t.draws         || 0,
  points:       t.points        || 0,
  goalsFor:     t.goals_for     || 0,
  goalsAgainst: t.goals_against || 0,
});

// Matches are already serialized by the model's mapMatchRow helper
const serializeTournament = (t, teams = [], matches = []) => ({
  id:              t.id,
  name:            t.name,
  sport:           t.sport,
  format:          t.format,       // 'group+knockout' already restored by model
  status:          t.status,
  startDate:       t.startDate,
  endDate:         t.endDate,
  venue:           t.venue,
  description:     t.description   || '',
  maxTeams:        t.maxTeams,
  organizerId:     t.organizerId,
  prizePool:       t.prizePool     || null,
  entryFee:        t.entryFee      || null,
  banner:          t.banner        || null,
  createdAt:       t.createdAt,
  registeredTeams: teams.map(serializeTeam),
  matches,    // already serialized by model
});

// ─── GET /api/tournaments ─────────────────────────────────────────────────────
const listTournaments = async (req, res, next) => {
  try {
    const { search, sport, status, page = 1, limit = 20 } = req.query;
    // If organizer_id param is explicitly passed use it; otherwise show all
    const organizerId = req.query.organizerId || null;

    const result = await tournamentModel.findAll({
      search,
      sport,
      status,
      page:  parseInt(page,  10),
      limit: parseInt(limit, 10),
      organizerId,
    });

    res.json({
      data:  result.data.map((t) => serializeTournament(t)),
      total: result.total,
      page:  result.page,
      limit: result.limit,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/tournaments/:id ─────────────────────────────────────────────────
const getTournament = async (req, res, next) => {
  try {
    const tournament = await tournamentModel.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    const [teams, matches] = await Promise.all([
      tournamentModel.getTeams(req.params.id),
      tournamentModel.getMatches(req.params.id),
    ]);

    res.json(serializeTournament(tournament, teams, matches));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/tournaments ────────────────────────────────────────────────────
const createTournament = async (req, res, next) => {
  try {
    const {
      name, sport, description, format,
      maxTeams = 8, startDate, endDate,
      venue, prizePool, entryFee, teamNames = [],
    } = req.body;

    if (!name || !sport || !format || !startDate || !endDate) {
      return res.status(400).json({
        error: 'name, sport, format, startDate, and endDate are required',
      });
    }

    const tournament = await tournamentModel.create({
      name, sport, description, format,
      maxTeams, startDate, endDate,
      venue, prizePool, entryFee,
      organizerId: req.user.id,
      teamNames,
    });

    res.status(201).json(serializeTournament(tournament));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/tournaments/:id/teams ──────────────────────────────────────────
const getTournamentTeams = async (req, res, next) => {
  try {
    const teams = await tournamentModel.getTeams(req.params.id);
    res.json({ data: teams.map(serializeTeam) });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/tournaments/:id/matches ─────────────────────────────────────────
const getTournamentMatches = async (req, res, next) => {
  try {
    const { status } = req.query;
    const matches = await tournamentModel.getMatches(req.params.id, status || null);
    res.json({ data: matches });   // already serialized by model
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/tournaments/:id/standings ───────────────────────────────────────
const getTournamentStandings = async (req, res, next) => {
  try {
    const standings = await tournamentModel.getStandings(req.params.id);
    res.json({ data: standings });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/tournaments/:id ───────────────────────────────────────────────────
const updateTournament = async (req, res, next) => {
  try {
    const { name, description, status, venue } = req.body;
    const tournament = await tournamentModel.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    
    // Authorization check
    if (tournament.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this tournament' });
    }

    const updated = await tournamentModel.update(req.params.id, { name, description, status, venue });
    res.json(serializeTournament(updated));
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/tournaments/:id ──────────────────────────────────────────────
const deleteTournament = async (req, res, next) => {
  try {
    const tournament = await tournamentModel.findById(req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    // Authorization check
    if (tournament.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this tournament' });
    }

    await tournamentModel.remove(req.params.id);
    res.json({ message: 'Tournament deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/tournaments/:id/bracket ────────────────────────────────────────
const getTournamentBracket = async (req, res, next) => {
  try {
    const rounds = await tournamentModel.getBracket(req.params.id);
    res.json({ data: rounds });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listTournaments,
  getTournament,
  createTournament,
  updateTournament,
  deleteTournament,
  getTournamentTeams,
  getTournamentMatches,
  getTournamentStandings,
  getTournamentBracket,
};
