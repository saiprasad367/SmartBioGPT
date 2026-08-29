const env = require('./env');
const { createApp, startServer, optionalAuth, redis } = require('@sbg/shared');
const controller = require('./controller');

const health = async (_req, res) => {
    const redisState = await redis.healthcheck();
    res.json({ status: 'ok', service: 'bio-service', checks: { redis: redisState } });
};

const app = createApp({
    serviceName: 'bio-service',
    mount(router) {
        router.get('/health', health);
        router.get('/api/bio/health', health);
        router.get('/api/bio/status', controller.status);

        router.post('/api/bio/search', optionalAuth, controller.search);
        router.get('/api/bio/protein/:accession', optionalAuth, controller.getByAccession);
        router.get('/api/structure/:identifier', optionalAuth, controller.getStructure);
    },
});

startServer(app, { port: env.PORT, serviceName: 'bio-service' });
