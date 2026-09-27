const express = require('express');
const { login, register, getMe, listUsers } = require('../controllers/authController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, requireRoles('ADMIN'), listUsers);

module.exports = router;
