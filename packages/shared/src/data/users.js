const { query } = require('../db');

const PUBLIC_COLS = 'id, email, name, avatar_url, email_verified, created_at';

function toUser(row) {
    if (!row) return null;
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatar_url || null,
        emailVerified: row.email_verified,
        createdAt: row.created_at,
    };
}

async function findByEmail(email) {
    const { rows } = await query(
        `SELECT ${PUBLIC_COLS}, password_hash, google_id FROM users WHERE email = $1`,
        [email]
    );
    return rows[0] || null; // raw row (includes password_hash) - caller decides
}

async function findById(id) {
    const { rows } = await query(`SELECT ${PUBLIC_COLS} FROM users WHERE id = $1`, [id]);
    return toUser(rows[0]);
}

async function findByGoogleId(googleId) {
    const { rows } = await query(`SELECT ${PUBLIC_COLS} FROM users WHERE google_id = $1`, [googleId]);
    return toUser(rows[0]);
}

async function createWithPassword({ name, email, passwordHash }) {
    const { rows } = await query(
        `INSERT INTO users (name, email, password_hash, email_verified)
         VALUES ($1, $2, $3, true)
         RETURNING ${PUBLIC_COLS}`,
        [name, email, passwordHash]
    );
    return toUser(rows[0]);
}

/** Upsert a Google-authenticated user: match by google_id, else by email, else create. */
async function upsertGoogleUser({ googleId, email, name, avatarUrl }) {
    // 1. already linked to this Google account
    const byGoogle = await query(`SELECT ${PUBLIC_COLS} FROM users WHERE google_id = $1`, [googleId]);
    if (byGoogle.rows[0]) {
        const { rows } = await query(
            `UPDATE users SET avatar_url = COALESCE($2, avatar_url), updated_at = now()
             WHERE google_id = $1 RETURNING ${PUBLIC_COLS}`,
            [googleId, avatarUrl || null]
        );
        return toUser(rows[0]);
    }

    // 2. existing email/password account with the same address -> link it
    // 3. brand new account
    const { rows } = await query(
        `INSERT INTO users (name, email, google_id, avatar_url, email_verified)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (email) DO UPDATE
           SET google_id = COALESCE(users.google_id, EXCLUDED.google_id),
               avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
               email_verified = true,
               updated_at = now()
         RETURNING ${PUBLIC_COLS}`,
        [name, email, googleId, avatarUrl || null]
    );
    return toUser(rows[0]);
}

module.exports = {
    toUser,
    findByEmail,
    findById,
    findByGoogleId,
    createWithPassword,
    upsertGoogleUser,
};
