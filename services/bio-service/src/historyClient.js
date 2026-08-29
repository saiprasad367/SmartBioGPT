const { createHttpClient, logger } = require('@sbg/shared');
const env = require('./env');

const client = createHttpClient('chat-internal', {
    baseURL: env.CHAT_SERVICE_URL,
    timeout: 4000,
    retries: 1,
    headers: { 'x-internal-key': env.INTERNAL_API_KEY },
});

/** Best-effort: record a signed-in user's search. Never blocks the response. */
function recordSearch(userId, query, accession) {
    client
        .post('/internal/search-history', { userId, query, accession })
        .catch((err) => logger.debug({ err: err.message }, 'recordSearch skipped'));
}

module.exports = { recordSearch };
