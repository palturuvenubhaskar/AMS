const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

router.post('/login', auth.login);
router.post('/register', authenticate, require('../middleware/authorize')('admin'), auth.register);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);
router.get('/me', authenticate, auth.getMe);
router.put('/change-password', authenticate, auth.changePassword);

module.exports = router;
