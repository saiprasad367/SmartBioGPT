const express = require('express');
const router = express.Router();
const { searchBioData } = require('../controllers/bioController');
// const { protect } = require('../middleware/authMiddleware');

// Temporarily public to allow 3D viewer access if DB/Auth is down
router.post('/search', searchBioData);

module.exports = router;
