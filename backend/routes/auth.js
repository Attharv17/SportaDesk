const router     = require('express').Router();
const auth       = require('../middleware/auth');
const controller = require('../controllers/authController');

router.post('/register', controller.register);
router.post('/login',    controller.login);
router.post('/logout',   auth, controller.logout);
router.get('/me',        auth, controller.me);

module.exports = router;
