const router     = require('express').Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const controller = require('../controllers/matchController');

// GET /api/matches/live?tournamentId=<uuid>
router.get('/live', verifyToken, controller.getLiveMatches);

// PUT /api/matches/:id/score  (organizer only — update live score)
router.put('/:id/score', verifyToken, authorizeRoles('organizer'), controller.updateScore);

module.exports = router;
