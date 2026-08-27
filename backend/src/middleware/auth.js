const { supabaseAuth } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const cache = new Map(); // token -> { user, exp }
const TOKEN_TTL_MS = 60_000;

function extractToken(req) {
    const h = req.headers.authorization || '';
    if (h.startsWith('Bearer ')) return h.slice(7).trim();
    return null;
}

async function resolveUser(token) {
    const hit = cache.get(token);
    if (hit && hit.exp > Date.now()) return hit.user;

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data?.user) throw ApiError.unauthorized('Invalid or expired session');

    const user = {
        id: data.user.id,
        email: data.user.email,
        name:
            data.user.user_metadata?.name ||
            data.user.user_metadata?.full_name ||
            data.user.email?.split('@')[0] ||
            'Researcher',
    };
    cache.set(token, { user, exp: Date.now() + TOKEN_TTL_MS });
    if (cache.size > 5000) cache.clear();
    return user;
}

/** Hard requirement: 401 if there is no valid Supabase JWT. */
const requireAuth = asyncHandler(async (req, _res, next) => {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized('Authentication required');
    req.user = await resolveUser(token);
    req.accessToken = token;
    next();
});

/** Soft: attaches req.user when a valid token is present, otherwise continues. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
    const token = extractToken(req);
    if (token) {
        try {
            req.user = await resolveUser(token);
            req.accessToken = token;
        } catch {
            /* ignore - anonymous */
        }
    }
    next();
});

module.exports = { requireAuth, optionalAuth };
