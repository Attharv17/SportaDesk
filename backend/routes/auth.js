const router     = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/authController');

router.post('/register', controller.register);
router.post('/login',    controller.login);
router.post('/logout',   verifyToken, controller.logout);
router.get('/me',        verifyToken, controller.me);

module.exports = router;
