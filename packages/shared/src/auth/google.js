const { OAuth2Client } = require('google-auth-library');
const ApiError = require('../ApiError');
const logger = require('../logger');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_ENABLED = Boolean(CLIENT_ID);

const client = GOOGLE_ENABLED ? new OAuth2Client(CLIENT_ID) : null;

/**
 * Verify a Google Identity Services ID token (the credential returned by the
 * "Sign in with Google" button) and return a normalized profile.
 */
async function verifyIdToken(idToken) {
    if (!client) throw ApiError.unavailable('Google sign-in is not configured', { code: 'GOOGLE_DISABLED' });
    if (!idToken) throw ApiError.badRequest('Missing Google credential');

    let ticket;
    try {
        ticket = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
    } catch (err) {
        logger.warn({ err: err.message }, 'google id token verification failed');
        throw ApiError.unauthorized('Invalid Google credential');
    }

    const p = ticket.getPayload();
    if (!p?.email || !p.email_verified) {
        throw ApiError.forbidden('Google account email is not verified');
    }

    return {
        googleId: p.sub,
        email: p.email.toLowerCase(),
        name: p.name || p.email.split('@')[0],
        avatarUrl: p.picture || null,
    };
}

module.exports = { verifyIdToken, GOOGLE_ENABLED };
