const pino = require('pino');

/**
 * Structured logger, one per process. JSON in production (ships to any
 * aggregator), pretty in development. The service name comes from
 * SERVICE_NAME so every log line is attributable in a multi-service deploy.
 */
const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    base: { service: process.env.SERVICE_NAME || 'sbg-service' },
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-internal-key"]',
            '*.password',
            '*.password_hash',
            '*.token',
            '*.access_token',
            '*.refresh_token',
            '*.refreshToken',
            '*.idToken',
        ],
        censor: '[redacted]',
    },
    transport: isProd
        ? undefined
        : {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' },
          },
});

module.exports = logger;
