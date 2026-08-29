const ApiError = require('./ApiError');
const asyncHandler = require('./asyncHandler');
const { verifyAccessToken } = require('./jwt');

function extractToken(req) {
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) return h.slice(7).trim();
    return null;
}

/** Hard requirement: 401 unless a valid access token is present. */
const requireAuth = asyncHandler(async (req, _res, next) => {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Authentication required');
    req.user = verifyAccessToken(token);
    req.accessToken = token;
    next();
});

/** Soft: attaches req.user when a valid token is present, otherwise continues. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
    const token = extractToken(req);
    if (token) {
        try {
            req.user = verifyAccessToken(token);
            req.accessToken = token;
        } catch {
            /* anonymous */
        }
    }
    next();
});

/**
 * Guards service-to-service endpoints. The caller must present the shared
 * INTERNAL_API_KEY in the x-internal-key header. Never exposed via the gateway.
 */
function requireInternalKey(req, _res, next) {
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected) return next(ApiError.unavailable('internal API not configured'));
    if (req.headers['x-internal-key'] !== expected) {
        return next(ApiError.forbidden('internal endpoint'));
    }
    next();
}

module.exports = { requireAuth, optionalAuth, requireInternalKey };
