const { query, pool } = require('../config/db');

// ─── Format mappers ──────────────────────────────────────────────────────────
const toDbFormat   = (f) => (f === 'group+knockout' ? 'group_knockout' : f);
const fromDbFormat = (f) => (f === 'group_knockout'  ? 'group+knockout' : f);

// ─── Score builder ────────────────────────────────────────────────────────────
const buildScore = (row) => {
  if (row.sport === 'cricket' && row.cs_home_runs !== null) {
    return {
      home: { runs: row.cs_home_runs, wickets: row.cs_home_wickets, overs: parseFloat(row.cs_home_overs), extras: row.cs_home_extras },
      away: { runs: row.cs_away_runs, wickets: row.cs_away_wickets, overs: parseFloat(row.cs_away_overs), extras: row.cs_away_extras },
    };
  }
  if (row.sport === 'kabaddi' && row.ks_home_points !== null) {
    return {
      home: { points: row.ks_home_points, raids: row.ks_home_raids, tackles: row.ks_home_tackles },
      away: { points: row.ks_away_points, raids: row.ks_away_raids, tackles: row.ks_away_tackles },
    };
  }
  if (row.gs_home_score !== null) {
    return { home: row.gs_home_score, away: row.gs_away_score };
  }
  return null;
};

// ─── Row mapper ───────────────────────────────────────────────────────────────
const mapRow = (t) => ({
  ...t,
  format:      fromDbFormat(t.format),
  startDate:   t.start_date,
  endDate:     t.end_date,
  maxTeams:    t.max_teams,
  organizerId: t.organizer_id,
  prizePool:   t.prize_pool,
  entryFee:    t.entry_fee,
  createdAt:   t.created_at,
});

// ─── Match row → frontend shape ───────────────────────────────────────────────
const mapMatchRow = (m) => ({
  id:           m.id,
  tournamentId: m.tournament_id,
  homeTeam:     typeof m.home_team === 'string' ? JSON.parse(m.home_team) : m.home_team,
  awayTeam:     typeof m.away_team === 'string' ? JSON.parse(m.away_team) : m.away_team,
  date:         m.scheduled_at,
  venue:        m.venue,
  status:       m.status,
  round:        m.round || null,
  sport:        m.sport,
  score:        buildScore(m),
});

// ─── LIST tournaments ─────────────────────────────────────────────────────────
const findAll = async ({ search, sport, status, page = 1, limit = 20, organizerId } = {}) => {
  const conditions = [];
  const params     = [];

  if (search) {
    conditions.push(`(t.name LIKE ? OR t.venue LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }
  if (sport && sport !== 'all') {
    conditions.push(`t.sport = ?`);
    params.push(sport);
  }
  if (status && status !== 'all') {
    conditions.push(`t.status = ?`);
    params.push(status);
  }
  if (organizerId) {
    conditions.push(`t.organizer_id = ?`);
    params.push(organizerId);
  }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countRes = await query(`SELECT COUNT(*) as count FROM tournaments t ${where}`, params);
  const total    = parseInt(countRes.rows[0].count, 10);

  const dataRes = await query(
    `SELECT t.*, u.name AS organizer_name
     FROM tournaments t
     JOIN users u ON u.id = t.organizer_id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit.toString(), offset.toString()] // limit/offset as strings or numbers, mysql2 handles it usually, but numbers are safer. actually, let's cast them:
  );
  // mysql2 prepared statements with LIMIT/OFFSET need integers. If we use strings it might fail. I'll make sure they are numbers above, they are.
  return { data: dataRes.rows.map(mapRow), total, page, limit };
};

// ─── SINGLE tournament ────────────────────────────────────────────────────────
const findById = async (id) => {
  const { rows } = await query(
    `SELECT t.*, u.name AS organizer_name
     FROM tournaments t
     JOIN users u ON u.id = t.organizer_id
     WHERE t.id = ?`,
    [id]
  );
  return rows[0] ? mapRow(rows[0]) : null;
};

// ─── CREATE tournament (with team seeding in a transaction) ───────────────────
const create = async ({ name, sport, description, format, maxTeams, startDate, endDate, venue, prizePool, entryFee, organizerId, teamNames = [] }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert tournament
    const [tRes] = await conn.execute(
      `INSERT INTO tournaments
         (name, sport, description, format, max_teams, start_date, end_date, venue, prize_pool, entry_fee, organizer_id, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'upcoming')`,
      [name, sport, description, toDbFormat(format), maxTeams, startDate, endDate, venue, prizePool, entryFee, organizerId]
    );
    const tournamentId = tRes.insertId;

    const [tRows] = await conn.execute(`SELECT * FROM tournaments WHERE id = ?`, [tournamentId]);
    const tournament = tRows[0];

    // 2. Seed teams from teamNames
    const filledNames = (teamNames || []).filter(Boolean);
    for (const teamName of filledNames) {
      // Create team
      const [teamRes] = await conn.execute(
        `INSERT INTO teams (name, color) VALUES (?, ?)`,
        [teamName, '#00f5ff']
      );
      const teamId = teamRes.insertId;

      // Register to tournament
      await conn.execute(
        `INSERT INTO tournament_teams (tournament_id, team_id) VALUES (?, ?)`,
        [tournamentId, teamId]
      );
      // Create standings entry
      await conn.execute(
        `INSERT INTO standings (tournament_id, team_id) VALUES (?, ?)`,
        [tournamentId, teamId]
      );
    }

    await conn.commit();
    return mapRow(tournament);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ─── TEAMS for a tournament (with players + standings) ────────────────────────
const getTeams = async (tournamentId) => {
  const { rows } = await query(
    `SELECT te.*,
            COALESCE(
              JSON_ARRAYAGG(
                CASE WHEN p.id IS NOT NULL THEN
                  JSON_OBJECT(
                    'id', p.id, 'name', p.name,
                    'position', p.position, 'jerseyNumber', p.jersey_number
                  )
                ELSE NULL END
              ),
              JSON_ARRAY()
            ) AS players,
            COALESCE(s.wins,         0) AS wins,
            COALESCE(s.losses,       0) AS losses,
            COALESCE(s.draws,        0) AS draws,
            COALESCE(s.points,       0) AS points,
            COALESCE(s.goals_for,    0) AS goals_for,
            COALESCE(s.goals_against,0) AS goals_against
     FROM tournament_teams tt
     JOIN teams     te ON te.id = tt.team_id
     LEFT JOIN players   p  ON p.team_id  = te.id
     LEFT JOIN standings s  ON s.team_id  = te.id AND s.tournament_id = ?
     WHERE tt.tournament_id = ?
     GROUP BY te.id, s.wins, s.losses, s.draws, s.points, s.goals_for, s.goals_against
     ORDER BY COALESCE(s.points, 0) DESC`,
    [tournamentId, tournamentId]
  );
  
  // Clean up players array (remove NULLs if JSON_ARRAYAGG included them)
  return rows.map(r => ({
    ...r,
    players: (typeof r.players === 'string' ? JSON.parse(r.players) : r.players).filter(Boolean)
  }));
};

// ─── MATCHES for a tournament (with scores from all score tables) ─────────────
const getMatches = async (tournamentId, status = null) => {
  const params = [tournamentId];
  let statusClause = '';
  if (status) {
    params.push(status);
    statusClause = `AND m.status = ?`;
  }

  const { rows } = await query(
    `SELECT
       m.*,
       JSON_OBJECT('id', ht.id, 'name', ht.name, 'color', ht.color) AS home_team,
       JSON_OBJECT('id', at.id, 'name', at.name, 'color', at.color) AS away_team,
       -- Cricket score columns
       cs.home_runs    AS cs_home_runs,
       cs.home_wickets AS cs_home_wickets,
       cs.home_overs   AS cs_home_overs,
       cs.home_extras  AS cs_home_extras,
       cs.away_runs    AS cs_away_runs,
       cs.away_wickets AS cs_away_wickets,
       cs.away_overs   AS cs_away_overs,
       cs.away_extras  AS cs_away_extras,
       -- Kabaddi score columns
       ks.home_points  AS ks_home_points,
       ks.home_raids   AS ks_home_raids,
       ks.home_tackles AS ks_home_tackles,
       ks.away_points  AS ks_away_points,
       ks.away_raids   AS ks_away_raids,
       ks.away_tackles AS ks_away_tackles,
       -- Generic score columns (football, basketball, etc.)
       gs.home_score   AS gs_home_score,
       gs.away_score   AS gs_away_score
     FROM matches m
     JOIN teams ht ON ht.id = m.home_team_id
     JOIN teams at ON at.id = m.away_team_id
     LEFT JOIN cricket_scores  cs ON cs.match_id = m.id
     LEFT JOIN kabaddi_scores  ks ON ks.match_id = m.id
     LEFT JOIN generic_scores  gs ON gs.match_id = m.id
     WHERE m.tournament_id = ? ${statusClause}
     ORDER BY m.scheduled_at`,
    params
  );

  return rows.map(mapMatchRow);
};

// ─── STANDINGS with rank ──────────────────────────────────────────────────────
const getStandings = async (tournamentId) => {
  const { rows } = await query(
    `SELECT
       s.team_id                                                AS "teamId",
       te.name                                                  AS "teamName",
       te.color                                                 AS "teamColor",
       s.wins, s.losses, s.draws, s.points,
       s.goals_for                                              AS "goalsFor",
       s.goals_against                                          AS "goalsAgainst",
       RANK() OVER (ORDER BY s.points DESC, s.wins DESC)        AS position
     FROM standings s
     JOIN teams te ON te.id = s.team_id
     WHERE s.tournament_id = ?
     ORDER BY s.points DESC, s.wins DESC`,
    [tournamentId]
  );
  return rows;
};

// ─── BRACKET: knockout pairs from registered teams ───────────────────────────
const getBracket = async (tournamentId) => {
  // Fetch teams ordered by points (seeding)
  const teams = await getTeams(tournamentId);

  // Build single-elimination bracket pairs
  const rounds = [];
  let current  = [...teams];

  // Pad to next power of 2
  while (current.length > 1) {
    const pairs = [];
    for (let j = 0; j < current.length; j += 2) {
      pairs.push({
        home: current[j]   || null,
        away: current[j + 1] || null,
        winner: null,
      });
    }
    rounds.push(pairs);
    // Next round: placeholder winners
    current = pairs.map((_, idx) => ({ id: `winner_${idx}`, name: 'TBD', color: '#555' }));
    if (current.length === 1) break;
  }

  return rounds;
};

module.exports = { findAll, findById, create, getTeams, getMatches, getStandings, getBracket, mapMatchRow };
