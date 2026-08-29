const { query } = require('../db');
const ApiError = require('../ApiError');

/**
 * Data-access layer for the user workspace (chats, messages, favorites,
 * search history). Every method is scoped by userId so a caller can only ever
 * touch their own rows.
 */

// ---- chats --------------------------------------------------------------

async function listChats(userId) {
    const { rows } = await query(
        `SELECT id, title, protein_accession, created_at, updated_at
         FROM chats WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 200`,
        [userId]
    );
    return rows;
}

async function createChat(userId, { title = 'New research session', proteinAccession = null } = {}) {
    const { rows } = await query(
        `INSERT INTO chats (user_id, title, protein_accession)
         VALUES ($1, $2, $3)
         RETURNING id, title, protein_accession, created_at, updated_at`,
        [userId, title, proteinAccession]
    );
    return rows[0];
}

async function getChat(userId, chatId) {
    const { rows } = await query(
        `SELECT id, title, protein_accession, created_at, updated_at
         FROM chats WHERE user_id = $1 AND id = $2`,
        [userId, chatId]
    );
    const chat = rows[0];
    if (!chat) throw ApiError.notFound('Chat not found');

    const { rows: messages } = await query(
        `SELECT id, role, content, degraded, created_at
         FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
        [chatId]
    );
    return { ...chat, messages };
}

async function updateChat(userId, chatId, patch) {
    const { rows } = await query(
        `UPDATE chats SET title = COALESCE($3, title), updated_at = now()
         WHERE user_id = $1 AND id = $2
         RETURNING id, title, protein_accession, updated_at`,
        [userId, chatId, patch.title ?? null]
    );
    if (!rows[0]) throw ApiError.notFound('Chat not found');
    return rows[0];
}

async function deleteChat(userId, chatId) {
    await query(`DELETE FROM chats WHERE user_id = $1 AND id = $2`, [userId, chatId]);
}

async function addMessage(chatId, { role, content, degraded = false }) {
    const { rows } = await query(
        `INSERT INTO messages (chat_id, role, content, degraded)
         VALUES ($1, $2, $3, $4)
         RETURNING id, role, content, degraded, created_at`,
        [chatId, role, content, degraded]
    );
    await query(`UPDATE chats SET updated_at = now() WHERE id = $1`, [chatId]);
    return rows[0];
}

async function listMessages(chatId) {
    const { rows } = await query(
        `SELECT id, role, content, degraded, created_at
         FROM messages WHERE chat_id = $1 ORDER BY created_at ASC`,
        [chatId]
    );
    return rows;
}

// ---- favorites --------------------------------------------------------

async function listFavorites(userId) {
    const { rows } = await query(
        `SELECT accession, name, gene, organism, created_at
         FROM favorites WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
}

async function addFavorite(userId, fav) {
    const { rows } = await query(
        `INSERT INTO favorites (user_id, accession, name, gene, organism)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, accession) DO UPDATE
           SET name = EXCLUDED.name, gene = EXCLUDED.gene, organism = EXCLUDED.organism
         RETURNING accession, name, gene, organism, created_at`,
        [userId, fav.accession, fav.name || null, fav.gene || null, fav.organism || null]
    );
    return rows[0];
}

async function removeFavorite(userId, accession) {
    await query(`DELETE FROM favorites WHERE user_id = $1 AND accession = $2`, [userId, accession]);
}

// ---- search history -------------------------------------------------

async function recordSearch(userId, { query: q, accession }) {
    try {
        await query(
            `INSERT INTO search_history (user_id, query, accession) VALUES ($1, $2, $3)`,
            [userId, q, accession || null]
        );
        return true;
    } catch {
        return false; // best-effort
    }
}

async function listSearchHistory(userId) {
    const { rows } = await query(
        `SELECT query, accession, created_at
         FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
    );
    return rows;
}

module.exports = {
    listChats,
    createChat,
    getChat,
    updateChat,
    deleteChat,
    addMessage,
    listMessages,
    listFavorites,
    addFavorite,
    removeFavorite,
    recordSearch,
    listSearchHistory,
};
