const router     = require('express').Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const controller = require('../controllers/tournamentController');

// All tournament routes require authentication
router.use(verifyToken);

router.get('/',                    controller.listTournaments);
// Creating a tournament should be organizer only
router.post('/',                   authorizeRoles('organizer'), controller.createTournament);
router.get('/:id',                 controller.getTournament);
router.get('/:id/teams',           controller.getTournamentTeams);
router.get('/:id/matches',         controller.getTournamentMatches);
router.get('/:id/standings',       controller.getTournamentStandings);
router.get('/:id/bracket',         controller.getTournamentBracket);

module.exports = router;
