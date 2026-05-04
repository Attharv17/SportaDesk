const { query, pool } = require('../config/db');
const { mapMatchRow } = require('./tournamentModel');

/**
 * Fetch live matches (optionally scoped to a tournament).
 * Includes sport-specific scores joined from all three score tables.
 * GET /api/matches/live
 */
const findLive = async (tournamentId = null) => {
  const params = [];
  let scopeClause = '';
  if (tournamentId) {
    params.push(tournamentId);
    scopeClause = 'AND m.tournament_id = ?';
  }

  const { rows } = await query(
    `SELECT
       m.*,
       t.name AS tournament_name,
       JSON_OBJECT('id', ht.id, 'name', ht.name, 'color', ht.color) AS home_team,
       JSON_OBJECT('id', at.id, 'name', at.name, 'color', at.color) AS away_team,
       -- Cricket
       cs.home_runs    AS cs_home_runs,
       cs.home_wickets AS cs_home_wickets,
       cs.home_overs   AS cs_home_overs,
       cs.home_extras  AS cs_home_extras,
       cs.away_runs    AS cs_away_runs,
       cs.away_wickets AS cs_away_wickets,
       cs.away_overs   AS cs_away_overs,
       cs.away_extras  AS cs_away_extras,
       -- Kabaddi
       ks.home_points  AS ks_home_points,
       ks.home_raids   AS ks_home_raids,
       ks.home_tackles AS ks_home_tackles,
       ks.away_points  AS ks_away_points,
       ks.away_raids   AS ks_away_raids,
       ks.away_tackles AS ks_away_tackles,
       -- Generic (football, basketball, etc.)
       gs.home_score   AS gs_home_score,
       gs.away_score   AS gs_away_score
     FROM matches m
     JOIN tournaments t  ON t.id  = m.tournament_id
     JOIN teams       ht ON ht.id = m.home_team_id
     JOIN teams       at ON at.id = m.away_team_id
     LEFT JOIN cricket_scores cs ON cs.match_id = m.id
     LEFT JOIN kabaddi_scores ks ON ks.match_id = m.id
     LEFT JOIN generic_scores gs ON gs.match_id = m.id
     WHERE m.status = 'live' ${scopeClause}
     ORDER BY m.scheduled_at`,
    params
  );

  return rows.map((r) => ({
    ...mapMatchRow(r),
    tournamentName: r.tournament_name,
  }));
};

/**
 * Update (upsert) a match score.
 * Called internally when a score update comes in.
 */
const upsertScore = async (matchId, sport, homeScore, awayScore) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Mark match as live if it isn't already completed
    await conn.execute(
      `UPDATE matches SET status = 'live' WHERE id = ? AND status = 'upcoming'`,
      [matchId]
    );

    if (sport === 'cricket') {
      await conn.execute(
        `INSERT INTO cricket_scores
           (match_id, home_runs, home_wickets, home_overs, home_extras,
            away_runs, away_wickets, away_overs, away_extras, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?, NOW())
         ON DUPLICATE KEY UPDATE
           home_runs    = VALUES(home_runs),
           home_wickets = VALUES(home_wickets),
           home_overs   = VALUES(home_overs),
           home_extras  = VALUES(home_extras),
           away_runs    = VALUES(away_runs),
           away_wickets = VALUES(away_wickets),
           away_overs   = VALUES(away_overs),
           away_extras  = VALUES(away_extras),
           updated_at   = NOW()`,
        [
          matchId,
          homeScore.runs, homeScore.wickets, homeScore.overs, homeScore.extras || 0,
          awayScore.runs, awayScore.wickets, awayScore.overs, awayScore.extras || 0,
        ]
      );
    } else if (sport === 'kabaddi') {
      await conn.execute(
        `INSERT INTO kabaddi_scores
           (match_id, home_points, home_raids, home_tackles,
            away_points, away_raids, away_tackles, updated_at)
         VALUES (?,?,?,?,?,?,?, NOW())
         ON DUPLICATE KEY UPDATE
           home_points  = VALUES(home_points),
           home_raids   = VALUES(home_raids),
           home_tackles = VALUES(home_tackles),
           away_points  = VALUES(away_points),
           away_raids   = VALUES(away_raids),
           away_tackles = VALUES(away_tackles),
           updated_at   = NOW()`,
        [matchId, homeScore.points, homeScore.raids, homeScore.tackles,
                  awayScore.points, awayScore.raids, awayScore.tackles]
      );
    } else {
      await conn.execute(
        `INSERT INTO generic_scores (match_id, home_score, away_score, updated_at)
         VALUES (?,?,?, NOW())
         ON DUPLICATE KEY UPDATE
           home_score = VALUES(home_score),
           away_score = VALUES(away_score),
           updated_at = NOW()`,
        [matchId, homeScore, awayScore]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findLive, upsertScore };
