const env = require('./config/env');
const logger = require('./config/logger');
const app = require('./app');

const server = app.listen(env.PORT, () => {
    logger.info(
        { port: env.PORT, env: env.NODE_ENV, ai: env.aiEnabled, mail: env.mailEnabled },
        `Smart Bio GPT API listening on :${env.PORT}`
    );
});

server.keepAliveTimeout = 61_000;
server.headersTimeout = 65_000;

// ---- graceful shutdown: stop accepting connections, drain, then exit ----
let shuttingDown = false;
function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down');
    server.close((err) => {
        if (err) {
            logger.error({ err }, 'error during shutdown');
            process.exit(1);
        }
        logger.info('closed remaining connections, exiting');
        process.exit(0);
    });
    setTimeout(() => {
        logger.warn('forced exit after shutdown timeout');
        process.exit(1);
    }, 10_000).unref();
}

['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'unhandledRejection');
});
process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaughtException - exiting');
    shutdown('uncaughtException');
});

module.exports = server;
