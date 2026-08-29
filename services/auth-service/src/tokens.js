const { jwt, data } = require('@sbg/shared');

/**
 * Issue a fresh access + refresh token pair for a user and persist the
 * refresh-token hash. Returns the shape the frontend expects.
 */
async function issueSession(user) {
    const token = jwt.signAccessToken(user);
    const { token: refreshToken, tokenHash, expiresAt } = jwt.generateRefreshToken();
    await data.refreshTokens.store({ userId: user.id, tokenHash, expiresAt });
    return {
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl || null },
        token,
        refreshToken,
        expiresAt: expiresAt.toISOString(),
    };
}

/** Rotate: revoke the presented refresh token, mint a new pair. */
async function rotateSession(oldRefreshToken, user) {
    await data.refreshTokens.revoke(jwt.hashRefreshToken(oldRefreshToken));
    return issueSession(user);
}

module.exports = { issueSession, rotateSession };
