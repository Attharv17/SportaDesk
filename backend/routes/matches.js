const router     = require('express').Router();
const auth       = require('../middleware/auth');
const controller = require('../controllers/matchController');

// GET /api/matches/live?tournamentId=<uuid>
router.get('/live', auth, controller.getLiveMatches);

// PUT /api/matches/:id/score  (organizer only — update live score)
router.put('/:id/score', auth, controller.updateScore);

module.exports = router;
