const { query } = require('../db');

/**
 * Refresh tokens are stored only as SHA-256 hashes. Rotation = insert the new
 * hash, revoke the old one, in the same call site.
 */
async function store({ userId, tokenHash, expiresAt }) {
    await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [userId, tokenHash, expiresAt]
    );
}

async function findValid(tokenHash) {
    const { rows } = await query(
        `SELECT id, user_id, expires_at, revoked_at
         FROM refresh_tokens
         WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
        [tokenHash]
    );
    return rows[0] || null;
}

async function revoke(tokenHash) {
    await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [tokenHash]);
}

async function revokeAllForUser(userId) {
    await query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId]
    );
}

/** Housekeeping - safe to call periodically. */
async function purgeExpired() {
    await query(`DELETE FROM refresh_tokens WHERE expires_at < now() - interval '7 days'`);
}

module.exports = { store, findValid, revoke, revokeAllForUser, purgeExpired };
