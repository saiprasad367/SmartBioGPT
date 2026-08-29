const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');

const logger = require('./logger');
const { notFound, errorHandler } = require('./errorMiddleware');
const { globalLimiter } = require('./rateLimit');

/**
 * Shared Express bootstrap for every microservice: request id, structured
 * access logs, security headers, CORS, JSON body limit, global rate limit.
 *
 * @param {object} opts
 * @param {(router: import('express').Router) => void} opts.mount  attach routes
 * @param {string} [opts.serviceName]
 */
function createApp({ mount, serviceName = process.env.SERVICE_NAME || 'sbg-service' }) {
    const app = express();

    // Hops between the client and this service that we trust to set
    // X-Forwarded-* (used for rate-limit keying and req.ip). Local/compose: 1
    // (gateway). Behind an extra edge proxy (Caddy, ALB, Cloudflare): 2.
    const trustProxy = process.env.TRUST_PROXY;
    app.set('trust proxy', trustProxy === undefined ? 1 : /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);
    app.disable('x-powered-by');

    app.use((req, _res, next) => {
        req.id = req.headers['x-request-id'] || crypto.randomUUID();
        next();
    });
    app.use(
        pinoHttp({
            logger,
            genReqId: (req) => req.id,
            customLogLevel: (_req, res, err) => {
                if (err || res.statusCode >= 500) return 'error';
                if (res.statusCode >= 400) return 'warn';
                return 'info';
            },
            autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/api/health' },
        })
    );

    app.use(helmet());

    const origins = (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    app.use(
        cors({
            origin(origin, cb) {
                if (!origin || origins.length === 0 || origins.includes(origin)) return cb(null, true);
                cb(new Error(`CORS: origin ${origin} not allowed`));
            },
            credentials: true,
        })
    );

    app.use(express.json({ limit: '256kb' }));
    app.use(globalLimiter());

    app.get('/', (_req, res) => res.json({ service: serviceName, status: 'up' }));

    const router = express.Router();
    mount(router);
    app.use(router);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };
