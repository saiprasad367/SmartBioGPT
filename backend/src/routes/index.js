const express = require('express');
const { authLimiter, aiLimiter } = require('../middleware/rateLimit');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const authController = require('../controllers/authController');
const bioController = require('../controllers/bioController');
const chatController = require('../controllers/chatController');
const userController = require('../controllers/userController');
const structureController = require('../controllers/structureController');
const healthController = require('../controllers/healthController');

const router = express.Router();

// ---- health / meta (no auth) ----------------------------------------
router.get('/health', healthController.live);
router.get('/health/ready', healthController.ready);
router.get('/status', healthController.status);

// ---- auth ----------------------------------------------------------
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh', authLimiter, authController.refresh);
router.get('/auth/me', requireAuth, authController.me);
router.post('/auth/logout', requireAuth, authController.logout);

// ---- bio search (optional auth: powers guest demo, records history when signed in) ----
router.post('/bio/search', optionalAuth, bioController.search);
router.get('/bio/protein/:accession', optionalAuth, bioController.getByAccession);

// ---- 3D structure ------------------------------------------------
router.get('/structure/:identifier', optionalAuth, structureController.getStructure);

// ---- chat (auth required) --------------------------------------
router.post('/chat/message', requireAuth, aiLimiter, chatController.sendMessage);
router.get('/chat', requireAuth, chatController.listChats);
router.get('/chat/:id', requireAuth, chatController.getChat);
router.patch('/chat/:id', requireAuth, chatController.renameChat);
router.delete('/chat/:id', requireAuth, chatController.deleteChat);

// ---- user workspace (auth required) ---------------------------
router.get('/user/favorites', requireAuth, userController.getFavorites);
router.post('/user/favorites', requireAuth, userController.addFavorite);
router.delete('/user/favorites/:accession', requireAuth, userController.removeFavorite);
router.get('/user/history', requireAuth, userController.getHistory);

module.exports = router;
