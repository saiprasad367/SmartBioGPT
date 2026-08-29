const env = require('./env');
const {
    createApp,
    startServer,
    requireAuth,
    requireInternalKey,
    aiLimiter,
    asyncHandler,
    db,
    redis,
    ai,
} = require('@sbg/shared');
const controller = require('./controller');

const health = asyncHandler(async (_req, res) => {
    const [dbState, redisState] = await Promise.all([db.healthcheck(), redis.healthcheck()]);
    const ok = dbState === 'ok';
    res.status(ok ? 200 : 503).json({
        status: ok ? 'ok' : 'degraded',
        service: 'chat-service',
        checks: { db: dbState, redis: redisState },
        features: { ai: ai.AI_ENABLED, model: ai.MODEL },
    });
});

const app = createApp({
    serviceName: 'chat-service',
    mount(router) {
        router.get('/health', health);
        router.get('/api/chat/health', health);

        // service-to-service
        router.post('/internal/search-history', requireInternalKey, controller.recordSearchHistory);

        // chat
        router.post('/api/chat/message', requireAuth, aiLimiter(), controller.sendMessage);
        router.get('/api/chat', requireAuth, controller.listChats);
        router.get('/api/chat/:id', requireAuth, controller.getChat);
        router.patch('/api/chat/:id', requireAuth, controller.renameChat);
        router.delete('/api/chat/:id', requireAuth, controller.deleteChat);

        // user workspace
        router.get('/api/user/favorites', requireAuth, controller.getFavorites);
        router.post('/api/user/favorites', requireAuth, controller.addFavorite);
        router.delete('/api/user/favorites/:accession', requireAuth, controller.removeFavorite);
        router.get('/api/user/history', requireAuth, controller.getHistory);
    },
});

startServer(app, { port: env.PORT, serviceName: 'chat-service' });
