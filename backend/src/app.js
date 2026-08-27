const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { globalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---- request id + structured access logs ----
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
        autoLogging: { ignore: (req) => req.url === '/api/health' },
    })
);

// ---- security + parsing ----
app.use(helmet());
app.use(
    cors({
        origin(origin, cb) {
            if (!origin || env.CORS_ORIGIN_LIST.includes(origin) || env.isDev) return cb(null, true);
            cb(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
    })
);
app.use(express.json({ limit: '256kb' }));
app.use(globalLimiter);

// ---- api ----
app.get('/', (_req, res) => res.json({ service: 'smart-bio-gpt-api', docs: '/api/status' }));
app.use('/api', routes);

// ---- fallthrough ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
