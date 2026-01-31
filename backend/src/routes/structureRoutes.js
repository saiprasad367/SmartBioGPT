const express = require('express');
const router = express.Router();
const { getStructure } = require('../controllers/structureController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:proteinId', protect, getStructure);

module.exports = router;
