const { query, pool } = require('../config/db');

const mapTeamRow = (t) => ({
  id: t.id,
  name: t.name,
  logo: t.logo,
  color: t.color,
  managerId: t.manager_id,
  createdAt: t.created_at,
  players: t.players ? (typeof t.players === 'string' ? JSON.parse(t.players) : t.players).filter(Boolean) : [],
  tournaments: t.tournaments ? (typeof t.tournaments === 'string' ? JSON.parse(t.tournaments) : t.tournaments).filter(Boolean) : []
});

const findByManagerId = async (managerId) => {
  const { rows } = await query(`
    SELECT t.*,
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
      (
        SELECT COALESCE(JSON_ARRAYAGG(
          JSON_OBJECT('id', tr.id, 'name', tr.name, 'status', tr.status)
        ), JSON_ARRAY())
        FROM tournament_teams tt
        JOIN tournaments tr ON tr.id = tt.tournament_id
        WHERE tt.team_id = t.id
      ) AS tournaments
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    WHERE t.manager_id = ?
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `, [managerId]);
  
  return rows.map(mapTeamRow);
};

const findById = async (id) => {
  const { rows } = await query(`
    SELECT t.*,
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
      ) AS players
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    WHERE t.id = ?
    GROUP BY t.id
  `, [id]);
  return rows[0] ? mapTeamRow(rows[0]) : null;
};

const create = async ({ name, color, logo, managerId }) => {
  const [result] = await pool.execute(
    'INSERT INTO teams (name, color, logo, manager_id) VALUES (?, ?, ?, ?)',
    [name, color || '#ff00ff', logo || null, managerId]
  );
  return findById(result.insertId);
};

const update = async (id, { name, color, logo }) => {
  const updates = [];
  const params = [];
  
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (color !== undefined) { updates.push('color = ?'); params.push(color); }
  if (logo !== undefined) { updates.push('logo = ?'); params.push(logo); }
  
  if (updates.length > 0) {
    params.push(id);
    await query(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`, params);
  }
  return findById(id);
};

const remove = async (id) => {
  await query('DELETE FROM teams WHERE id = ?', [id]);
};

const addPlayer = async ({ teamId, name, position, jerseyNumber, userId }) => {
  const [result] = await pool.execute(
    'INSERT INTO players (team_id, name, position, jersey_number, user_id) VALUES (?, ?, ?, ?, ?)',
    [teamId, name, position || null, jerseyNumber || null, userId || null]
  );
  return { id: result.insertId, teamId, name, position, jerseyNumber, userId };
};

const removePlayer = async (id) => {
  await query('DELETE FROM players WHERE id = ?', [id]);
};

module.exports = { findByManagerId, findById, create, update, remove, addPlayer, removePlayer };
