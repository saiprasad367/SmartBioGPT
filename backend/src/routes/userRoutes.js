const express = require('express');
const router = express.Router();
const {
    getFavorites,
    addFavorite,
    removeFavorite,
    sendWelcome
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/favorites', protect, getFavorites);
router.post('/favorites', protect, addFavorite);
router.delete('/favorites/:proteinId', protect, removeFavorite);
router.post('/welcome', sendWelcome);

module.exports = router;
