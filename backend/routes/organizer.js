const router = require('express').Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const tournamentController = require('../controllers/tournamentController');
const matchController = require('../controllers/matchController');

// Apply to all organizer routes
router.use(verifyToken, authorizeRoles('organizer'));

router.get('/dashboard', (req, res) => {
  res.json({ message: 'Welcome to the organizer dashboard' });
});

// Full CRUD for Tournaments
router.get('/tournaments', (req, res, next) => {
  req.query.organizerId = req.user.id; // Enforce fetching only their own tournaments
  tournamentController.listTournaments(req, res, next);
});
router.post('/tournaments', tournamentController.createTournament);
router.put('/tournaments/:id', tournamentController.updateTournament);
router.delete('/tournaments/:id', tournamentController.deleteTournament);

// Control over matches
router.put('/matches/:id/score', matchController.updateScore);

module.exports = router;
