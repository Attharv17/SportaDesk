const router     = require('express').Router();
const auth       = require('../middleware/auth');
const controller = require('../controllers/dashboardController');

router.get('/stats', auth, controller.getStats);

module.exports = router;
