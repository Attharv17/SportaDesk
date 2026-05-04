const router     = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/dashboardController');

router.get('/stats', verifyToken, controller.getStats);

module.exports = router;
