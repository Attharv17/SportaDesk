const { query } = require('../config/db');

/**
 * Fetch the player profile record linked to a user account,
 * including their team info and all teammates.
 */
const findProfileByUserId = async (userId) => {
  const { rows } = await query(
    `SELECT
       p.id,
       p.name,
       p.position,
       p.jersey_number AS jerseyNumber,
       t.id            AS teamId,
       t.name          AS teamName,
       t.color         AS teamColor,
       t.logo          AS teamLogo,
       u.email,
       u.avatar,
       u.created_at    AS memberSince
     FROM players p
     JOIN teams t   ON t.id  = p.team_id
     JOIN users u   ON u.id  = p.user_id
     WHERE p.user_id = ?
     LIMIT 1`,
    [userId]
  );

  if (!rows[0]) return null;

  const profile = rows[0];

  // Fetch teammates (excluding self)
  const { rows: mates } = await query(
    `SELECT id, name, position, jersey_number AS jerseyNumber
     FROM players
     WHERE team_id = ? AND user_id != ?`,
    [profile.teamId, userId]
  );

  // Fetch tournaments the team is part of
  const { rows: tournaments } = await query(
    `SELECT tr.id, tr.name, tr.sport, tr.status, tr.start_date AS startDate, tr.end_date AS endDate
     FROM tournament_teams tt
     JOIN tournaments tr ON tr.id = tt.tournament_id
     WHERE tt.team_id = ?`,
    [profile.teamId]
  );

  return {
    id:          profile.id,
    name:        profile.name,
    position:    profile.position,
    jerseyNumber: profile.jerseyNumber,
    email:       profile.email,
    avatar:      profile.avatar,
    memberSince: profile.memberSince,
    team: {
      id:         profile.teamId,
      name:       profile.teamName,
      color:      profile.teamColor,
      logo:       profile.teamLogo,
      teammates:  mates,
      tournaments,
    },
  };
};

/**
 * Fetch all matches for the team that the player belongs to.
 * Includes basic score and status info.
 */
const findMatchesByUserId = async (userId) => {
  const { rows: playerRows } = await query(
    'SELECT team_id FROM players WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (!playerRows[0]) return [];
  const teamId = playerRows[0].team_id;

  const { rows } = await query(
    `SELECT
       m.id,
       m.status,
       m.start_time      AS scheduledAt,
       m.venue,
       m.round,
       t.name              AS tournamentName,
       t.sport,
       JSON_OBJECT('id', ht.id, 'name', ht.name, 'color', ht.color) AS home_team,
       JSON_OBJECT('id', at.id, 'name', at.name, 'color', at.color) AS away_team,
       gs.home_score       AS gsHome,
       gs.away_score       AS gsAway,
       cs.home_runs        AS csHomeRuns,
       cs.home_wickets     AS csHomeWickets,
       cs.away_runs        AS csAwayRuns,
       cs.away_wickets     AS csAwayWickets
     FROM matches m
     JOIN tournaments t  ON t.id  = m.tournament_id
     JOIN teams       ht ON ht.id = m.home_team_id
     JOIN teams       at ON at.id = m.away_team_id
     LEFT JOIN generic_scores gs ON gs.match_id = m.id
     LEFT JOIN cricket_scores cs ON cs.match_id = m.id
     WHERE m.home_team_id = ? OR m.away_team_id = ?
     ORDER BY m.start_time DESC`,
    [teamId, teamId]
  );

  return rows.map((r) => {
    const homeTeam = typeof r.home_team === 'string' ? JSON.parse(r.home_team) : r.home_team;
    const awayTeam = typeof r.away_team === 'string' ? JSON.parse(r.away_team) : r.away_team;
    const isHome   = homeTeam.id === teamId;

    let result = null;
    if (r.status === 'completed') {
      const homeScore = r.gsHome ?? r.csHomeRuns ?? 0;
      const awayScore = r.gsAway ?? r.csAwayRuns ?? 0;
      if (homeScore === awayScore)      result = 'draw';
      else if (isHome && homeScore > awayScore) result = 'win';
      else if (!isHome && awayScore > homeScore) result = 'win';
      else                              result = 'loss';
    }

    return {
      id:             r.id,
      status:         r.status,
      scheduledAt:    r.scheduledAt,
      venue:          r.venue,
      round:          r.round,
      tournamentName: r.tournamentName,
      sport:          r.sport,
      homeTeam,
      awayTeam,
      isHome,
      result,
      score: {
        home: r.gsHome ?? (r.csHomeRuns != null ? `${r.csHomeRuns}/${r.csHomeWickets}` : null),
        away: r.gsAway ?? (r.csAwayRuns != null ? `${r.csAwayRuns}/${r.csAwayWickets}` : null),
      },
    };
  });
};

module.exports = { findProfileByUserId, findMatchesByUserId };
