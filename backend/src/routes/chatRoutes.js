const express = require('express');
const router = express.Router();
const { sendMessage, getHistory, getSession } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/message', protect, sendMessage);
router.get('/history', protect, getHistory);
router.get('/session/:id', protect, getSession);

module.exports = router;
