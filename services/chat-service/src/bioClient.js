const { createHttpClient, logger } = require('@sbg/shared');
const env = require('./env');

const client = createHttpClient('bio-internal', {
    baseURL: env.BIO_SERVICE_URL,
    timeout: 15000,
    retries: 1,
    headers: { 'x-internal-key': env.INTERNAL_API_KEY },
});

/** Resolve a protein dossier for chat context. Returns null on any failure. */
async function getDossier(accession) {
    try {
        const res = await client.get(`/api/bio/protein/${encodeURIComponent(accession)}`);
        return res.data?.data || null;
    } catch (err) {
        logger.debug({ err: err.message, accession }, 'context dossier unavailable');
        return null;
    }
}

module.exports = { getDossier };
