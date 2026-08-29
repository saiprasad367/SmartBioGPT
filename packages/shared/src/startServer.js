const logger = require('./logger');
const db = require('./db');
const redis = require('./redis');

/**
 * Boot an Express app with production-grade lifecycle handling:
 * keep-alive tuning, SIGTERM/SIGINT connection draining, and clean shutdown
 * of the shared Postgres / Redis clients.
 */
function startServer(app, { port, serviceName = process.env.SERVICE_NAME || 'sbg-service' }) {
    const server = app.listen(port, () => {
        logger.info({ port, env: process.env.NODE_ENV }, `${serviceName} listening on :${port}`);
    });

    server.keepAliveTimeout = 61_000;
    server.headersTimeout = 65_000;

    let shuttingDown = false;
    async function shutdown(signal) {
        if (shuttingDown) return;
        shuttingDown = true;
        logger.info({ signal }, 'shutting down');

        const forced = setTimeout(() => {
            logger.warn('forced exit after shutdown timeout');
            process.exit(1);
        }, 12_000).unref();

        server.close(async () => {
            await Promise.allSettled([db.close(), redis.close()]);
            clearTimeout(forced);
            logger.info('clean shutdown complete');
            process.exit(0);
        });
    }

    ['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));

    process.on('unhandledRejection', (reason) => {
        const err = reason instanceof Error ? reason : new Error(String(reason));
        logger.error({ err }, 'unhandledRejection');
    });
    process.on('uncaughtException', (err) => {
        logger.fatal({ err }, 'uncaughtException - exiting');
        shutdown('uncaughtException');
    });

    return server;
}

module.exports = { startServer };
