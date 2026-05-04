const router = require('express').Router();
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const playerController = require('../controllers/playerController');

// All player routes require authentication and player role
router.use(verifyToken, authorizeRoles('player'));

// Read-only: player profile + team
router.get('/profile', playerController.getProfile);

// Read-only: match schedule + history for the player's team
router.get('/matches', playerController.getMatches);

module.exports = router;
