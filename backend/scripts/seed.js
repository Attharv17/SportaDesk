const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('🔄 Starting Database Reset & Seed...');
    
    // Disable foreign key checks so we can drop tables freely
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    
    console.log('🗑️ Dropping existing tables...');
    const tables = [
      'cricket_scores', 'generic_scores', 'kabaddi_scores', 
      'matches', 'players', 'refresh_tokens', 'standings', 
      'tournament_teams', 'teams', 'tournaments', 'users'
    ];
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS ${table}`);
    }

    console.log('🏗️ Creating tables...');
    
    await pool.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('organizer', 'manager', 'player') NOT NULL,
        avatar VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE tournaments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sport ENUM('cricket', 'kabaddi', 'football', 'basketball', 'volleyball', 'badminton') NOT NULL,
        format ENUM('league', 'knockout', 'group+knockout') NOT NULL,
        status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
        start_date DATE,
        end_date DATE,
        venue VARCHAR(255),
        description TEXT,
        max_teams INT DEFAULT 8,
        prize_pool VARCHAR(100),
        entry_fee VARCHAR(100),
        organizer_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(50) DEFAULT '#00ffff',
        logo VARCHAR(255),
        manager_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE tournament_teams (
        tournament_id INT NOT NULL,
        team_id INT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tournament_id, team_id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE standings (
        tournament_id INT NOT NULL,
        team_id INT NOT NULL,
        played INT DEFAULT 0,
        wins INT DEFAULT 0,
        losses INT DEFAULT 0,
        draws INT DEFAULT 0,
        points INT DEFAULT 0,
        goals_for INT DEFAULT 0,
        goals_against INT DEFAULT 0,
        PRIMARY KEY (tournament_id, team_id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(100),
        jersey_number INT,
        user_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE TABLE matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tournament_id INT NOT NULL,
        home_team_id INT NOT NULL,
        away_team_id INT NOT NULL,
        status ENUM('scheduled', 'live', 'completed') DEFAULT 'scheduled',
        start_time DATETIME,
        venue VARCHAR(255),
        round VARCHAR(100),
        sport VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE cricket_scores (
        match_id INT PRIMARY KEY,
        home_runs INT DEFAULT 0,
        home_wickets INT DEFAULT 0,
        home_overs DECIMAL(4,1) DEFAULT 0.0,
        home_extras INT DEFAULT 0,
        away_runs INT DEFAULT 0,
        away_wickets INT DEFAULT 0,
        away_overs DECIMAL(4,1) DEFAULT 0.0,
        away_extras INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE kabaddi_scores (
        match_id INT PRIMARY KEY,
        home_points INT DEFAULT 0,
        home_raids INT DEFAULT 0,
        home_tackles INT DEFAULT 0,
        away_points INT DEFAULT 0,
        away_raids INT DEFAULT 0,
        away_tackles INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE generic_scores (
        match_id INT PRIMARY KEY,
        home_score INT DEFAULT 0,
        away_score INT DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
      )
    `);

    // Re-enable foreign key checks
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🌱 Seeding data...');

    const pass = await bcrypt.hash('password123', 10);

    // 1. Users
    const [orgRes] = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Admin Organizer', 'organizer@test.com', pass, 'organizer']);
    const orgId = orgRes.insertId;

    const [mgr1Res] = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Manager One', 'manager1@test.com', pass, 'manager']);
    const [mgr2Res] = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Manager Two', 'manager2@test.com', pass, 'manager']);
    const mgr1 = mgr1Res.insertId;
    const mgr2 = mgr2Res.insertId;

    const [p1Res] = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Player One', 'player1@test.com', pass, 'player']);
    const p1 = p1Res.insertId;

    // 2. Teams
    const [t1Res] = await pool.query('INSERT INTO teams (name, color, manager_id) VALUES (?, ?, ?)', ['Cyber Titans', '#00f5ff', mgr1]);
    const [t2Res] = await pool.query('INSERT INTO teams (name, color, manager_id) VALUES (?, ?, ?)', ['Neon Strikers', '#ff00ff', mgr2]);
    const team1 = t1Res.insertId;
    const team2 = t2Res.insertId;

    // 3. Tournaments
    const [tourRes] = await pool.query(`
      INSERT INTO tournaments (name, sport, format, status, start_date, end_date, venue, description, organizer_id)
      VALUES (?, ?, ?, ?, '2026-06-01', '2026-06-30', 'Neon Arena', 'Epic tech league', ?)
    `, ['Cyber Football Cup', 'football', 'league', 'active', orgId]);
    const tourId = tourRes.insertId;

    // 4. Tournament Teams & Standings
    await pool.query('INSERT INTO tournament_teams (tournament_id, team_id) VALUES (?, ?), (?, ?)', [tourId, team1, tourId, team2]);
    await pool.query('INSERT INTO standings (tournament_id, team_id) VALUES (?, ?), (?, ?)', [tourId, team1, tourId, team2]);

    // 5. Players
    await pool.query('INSERT INTO players (team_id, name, position, jersey_number, user_id) VALUES (?, ?, ?, ?, ?)', [team1, 'Player One', 'Forward', 10, p1]);
    await pool.query('INSERT INTO players (team_id, name, position, jersey_number) VALUES (?, ?, ?, ?)', [team1, 'Alex Reed', 'Midfielder', 8]);
    await pool.query('INSERT INTO players (team_id, name, position, jersey_number) VALUES (?, ?, ?, ?)', [team2, 'Jordan Cole', 'Defender', 4]);

    // 6. Matches
    const [m1Res] = await pool.query(`
      INSERT INTO matches (tournament_id, home_team_id, away_team_id, status, start_time, venue, round, sport)
      VALUES (?, ?, ?, 'completed', '2026-06-05 18:00:00', 'Neon Arena', 'Round 1', 'football')
    `, [tourId, team1, team2]);
    
    const [m2Res] = await pool.query(`
      INSERT INTO matches (tournament_id, home_team_id, away_team_id, status, start_time, venue, round, sport)
      VALUES (?, ?, ?, 'scheduled', '2026-06-12 18:00:00', 'Neon Arena', 'Round 2', 'football')
    `, [tourId, team2, team1]);

    // 7. Scores
    await pool.query('INSERT INTO generic_scores (match_id, home_score, away_score) VALUES (?, ?, ?)', [m1Res.insertId, 3, 1]);
    
    // Update standings manually for mock
    await pool.query('UPDATE standings SET played=1, wins=1, points=3, goals_for=3, goals_against=1 WHERE tournament_id=? AND team_id=?', [tourId, team1]);
    await pool.query('UPDATE standings SET played=1, losses=1, points=0, goals_for=1, goals_against=3 WHERE tournament_id=? AND team_id=?', [tourId, team2]);

    console.log('✅ Database successfully seeded!');
    console.log(`
      Test Accounts (Password for all: password123)
      - Organizer: organizer@test.com
      - Manager 1: manager1@test.com
      - Manager 2: manager2@test.com
      - Player:    player1@test.com
    `);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during database seed:', err);
    process.exit(1);
  }
};

seed();
