const router = require('express').Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const teamController = require('../controllers/teamController');
const matchController = require('../controllers/matchController');

// Apply to all manager routes
router.use(verifyToken, authorizeRoles('manager'));

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Welcome to the manager dashboard' });
});

// Teams CRUD
router.get('/teams', teamController.listTeams);
router.post('/teams', teamController.createTeam);
router.put('/teams/:id', teamController.updateTeam);
router.delete('/teams/:id', teamController.deleteTeam);

// Player management
router.post('/teams/:id/players', teamController.addPlayer);
router.delete('/teams/:id/players/:playerId', teamController.removePlayer);

// Matches
router.get('/matches', matchController.getManagerMatches);

module.exports = router;
