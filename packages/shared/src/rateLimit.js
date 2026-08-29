const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const ApiError = require('./ApiError');
const logger = require('./logger');
const { getRedis } = require('./redis');

const handler = (_req, _res, next) => next(ApiError.tooMany('Rate limit exceeded, slow down'));
const keyByUserOrIp = (req) => req.user?.id || req.ip;

/**
 * Shared Redis store so the limit is enforced across every replica of a
 * service, not per-process. Falls back to the in-memory store if Redis is off.
 */
function store(prefix) {
    const redis = getRedis();
    if (!redis) return undefined;
    return new RedisStore({
        prefix: `rl:${prefix}:`,
        sendCommand: (...args) => redis.call(...args),
    });
}

function makeLimiter(name, { windowMs, max, keyGenerator = keyByUserOrIp }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator,
        handler,
        store: store(name),
    });
}

/** Broad protection for a whole service. */
const globalLimiter = () => makeLimiter('global', { windowMs: 60_000, max: 240 });
/** Tighter budget for expensive AI calls. */
const aiLimiter = () => makeLimiter('ai', { windowMs: 60_000, max: 20 });
/** Auth endpoints: protect against credential stuffing (keyed by IP). */
const authLimiter = () =>
    makeLimiter('auth', { windowMs: 15 * 60_000, max: 40, keyGenerator: (req) => req.ip });

logger.debug('rate limiters initialised');

module.exports = { globalLimiter, aiLimiter, authLimiter, makeLimiter };
