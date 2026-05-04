const router     = require('express').Router();
const auth       = require('../middleware/auth');
const controller = require('../controllers/tournamentController');

// All tournament routes require authentication
router.use(auth);

router.get('/',                    controller.listTournaments);
router.post('/',                   controller.createTournament);
router.get('/:id',                 controller.getTournament);
router.get('/:id/teams',           controller.getTournamentTeams);
router.get('/:id/matches',         controller.getTournamentMatches);
router.get('/:id/standings',       controller.getTournamentStandings);
router.get('/:id/bracket',         controller.getTournamentBracket);

module.exports = router;
