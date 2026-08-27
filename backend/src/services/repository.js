const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Thin data-access layer over Supabase/Postgres. All methods are scoped by
 * userId so a caller can only ever touch their own rows, regardless of RLS.
 */

function must(error, context) {
    if (error) throw ApiError.upstream(`db: ${context}`, { details: error.message, cause: error });
}

// ---- chats --------------------------------------------------------------

async function listChats(userId) {
    const { data, error } = await supabaseAdmin
        .from('chats')
        .select('id, title, protein_accession, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(200);
    must(error, 'listChats');
    return data;
}

async function createChat(userId, { title = 'New research session', proteinAccession = null } = {}) {
    const { data, error } = await supabaseAdmin
        .from('chats')
        .insert({ user_id: userId, title, protein_accession: proteinAccession })
        .select('id, title, protein_accession, created_at, updated_at')
        .single();
    must(error, 'createChat');
    return data;
}

async function getChat(userId, chatId) {
    const { data: chat, error } = await supabaseAdmin
        .from('chats')
        .select('id, title, protein_accession, created_at, updated_at')
        .eq('user_id', userId)
        .eq('id', chatId)
        .maybeSingle();
    must(error, 'getChat');
    if (!chat) throw ApiError.notFound('Chat not found');

    const { data: messages, error: mErr } = await supabaseAdmin
        .from('messages')
        .select('id, role, content, degraded, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
    must(mErr, 'getChat.messages');
    return { ...chat, messages: messages || [] };
}

async function updateChat(userId, chatId, patch) {
    const { data, error } = await supabaseAdmin
        .from('chats')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', chatId)
        .select('id, title, protein_accession, updated_at')
        .maybeSingle();
    must(error, 'updateChat');
    if (!data) throw ApiError.notFound('Chat not found');
    return data;
}

async function deleteChat(userId, chatId) {
    const { error } = await supabaseAdmin
        .from('chats')
        .delete()
        .eq('user_id', userId)
        .eq('id', chatId);
    must(error, 'deleteChat');
}

async function addMessage(chatId, { role, content, degraded = false }) {
    const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({ chat_id: chatId, role, content, degraded })
        .select('id, role, content, degraded, created_at')
        .single();
    must(error, 'addMessage');
    await supabaseAdmin.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
    return data;
}

async function listMessages(chatId) {
    const { data, error } = await supabaseAdmin
        .from('messages')
        .select('id, role, content, degraded, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
    must(error, 'listMessages');
    return data || [];
}

// ---- favorites ---------------------------------------------------------

async function listFavorites(userId) {
    const { data, error } = await supabaseAdmin
        .from('favorites')
        .select('accession, name, gene, organism, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    must(error, 'listFavorites');
    return data;
}

async function addFavorite(userId, fav) {
    const { data, error } = await supabaseAdmin
        .from('favorites')
        .upsert(
            {
                user_id: userId,
                accession: fav.accession,
                name: fav.name || null,
                gene: fav.gene || null,
                organism: fav.organism || null,
            },
            { onConflict: 'user_id,accession' }
        )
        .select('accession, name, gene, organism, created_at')
        .single();
    must(error, 'addFavorite');
    return data;
}

async function removeFavorite(userId, accession) {
    const { error } = await supabaseAdmin
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('accession', accession);
    must(error, 'removeFavorite');
}

// ---- search history --------------------------------------------------

async function recordSearch(userId, { query, accession }) {
    const { error } = await supabaseAdmin
        .from('search_history')
        .insert({ user_id: userId, query, accession: accession || null });
    // history is best-effort; swallow errors quietly
    if (error) return false;
    return true;
}

async function listSearchHistory(userId) {
    const { data, error } = await supabaseAdmin
        .from('search_history')
        .select('query, accession, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    must(error, 'listSearchHistory');
    return data;
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
