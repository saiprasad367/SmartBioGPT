const pino = require('pino');
const env = require('./env');

/**
 * Single structured logger for the whole process.
 * - JSON in production (machine-parseable, ships to any log aggregator)
 * - pretty in development
 */
const logger = pino({
    level: process.env.LOG_LEVEL || (env.isProd ? 'info' : 'debug'),
    base: { service: 'smart-bio-gpt-api' },
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            '*.password',
            '*.token',
            '*.access_token',
        ],
        censor: '[redacted]',
    },
    transport: env.isProd
        ? undefined
        : {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,service' },
          },
});

module.exports = logger;
