const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiError = require('./ApiError');

/**
 * Access tokens are short-lived HS256 JWTs signed with JWT_SECRET. Every
 * service verifies them locally (no call back to auth-service), so auth
 * scales independently. Refresh tokens are opaque random strings - only their
 * SHA-256 hash is stored, and rotation happens in auth-service.
 */
const SECRET = process.env.JWT_SECRET;
const ISSUER = process.env.JWT_ISSUER || 'smart-bio-gpt';
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30;

function assertSecret() {
    if (!SECRET || SECRET.length < 16) {
        throw new Error('JWT_SECRET is missing or too short (>= 16 chars required)');
    }
}

function signAccessToken(user) {
    assertSecret();
    return jwt.sign(
        { sub: user.id, email: user.email, name: user.name },
        SECRET,
        { expiresIn: ACCESS_TTL, issuer: ISSUER }
    );
}

function verifyAccessToken(token) {
    assertSecret();
    try {
        const payload = jwt.verify(token, SECRET, { issuer: ISSUER });
        return { id: payload.sub, email: payload.email, name: payload.name };
    } catch {
        throw ApiError.unauthorized('Invalid or expired session');
    }
}

function generateRefreshToken() {
    const token = crypto.randomBytes(48).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS());
    return { token, tokenHash, expiresAt };
}

function hashRefreshToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function REFRESH_TOKEN_MS() {
    return REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
}

module.exports = {
    signAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    ACCESS_TTL,
    REFRESH_TTL_DAYS,
};
