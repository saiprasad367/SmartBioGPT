const express = require('express');
const router = express.Router();
const {
    registerUser,
    authUser,
    getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.get('/verify', protect, getUserProfile); // Using /verify as requested in plan

module.exports = router;
