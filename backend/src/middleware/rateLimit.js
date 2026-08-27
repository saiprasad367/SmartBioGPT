const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

const handler = (_req, _res, next) => next(ApiError.tooMany('Rate limit exceeded, slow down'));

const keyByUserOrIp = (req) => req.user?.id || req.ip;

/** Broad protection for the whole API. */
const globalLimiter = rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyByUserOrIp,
    handler,
});

/** Tighter budget for expensive AI calls. */
const aiLimiter = rateLimit({
    windowMs: 60_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyByUserOrIp,
    handler,
});

/** Auth endpoints: protect against credential stuffing. */
const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler,
});

module.exports = { globalLimiter, aiLimiter, authLimiter };
