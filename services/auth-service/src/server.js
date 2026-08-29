const env = require('./env');
const {
    createApp,
    startServer,
    requireAuth,
    authLimiter,
    asyncHandler,
    db,
    redis,
    auth,
} = require('@sbg/shared');
const controller = require('./controller');

const health = asyncHandler(async (_req, res) => {
    const [dbState, redisState] = await Promise.all([db.healthcheck(), redis.healthcheck()]);
    const ok = dbState === 'ok';
    res.status(ok ? 200 : 503).json({
        status: ok ? 'ok' : 'degraded',
        service: 'auth-service',
        checks: { db: dbState, redis: redisState },
        features: { google: auth.google.GOOGLE_ENABLED, mail: auth.email.MAIL_ENABLED },
    });
});

const app = createApp({
    serviceName: 'auth-service',
    mount(router) {
        router.get('/health', health);
        router.get('/api/auth/health', health);

        const limit = authLimiter();
        router.post('/api/auth/register', limit, controller.register);
        router.post('/api/auth/login', limit, controller.login);
        router.post('/api/auth/google', limit, controller.google);
        router.post('/api/auth/refresh', limit, controller.refresh);
        router.get('/api/auth/me', requireAuth, controller.me);
        // logout only needs the refresh token to revoke - no valid access token required
        router.post('/api/auth/logout', limit, controller.logout);
    },
});

startServer(app, { port: env.PORT, serviceName: 'auth-service' });
