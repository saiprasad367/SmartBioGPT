const { createHttpClient } = require('../../utils/httpClient');

const client = createHttpClient('stringdb', { baseURL: 'https://string-db.org/api' });

/**
 * Top functional interaction partners from STRING, keyed by UniProt accession.
 * Non-critical.
 */
async function interactionPartners(accession, taxonId) {
    const params = new URLSearchParams({ identifiers: accession, limit: '12' });
    if (taxonId) params.set('species', String(taxonId));

    const res = await client.get(`/json/interaction_partners?${params.toString()}`);
    if (!Array.isArray(res.data)) return [];

    return res.data
        .map((r) => ({
            partner: r.preferredName_B,
            score: typeof r.score === 'number' ? Number(r.score.toFixed(3)) : null,
        }))
        .filter((r) => r.partner)
        .slice(0, 12);
}

module.exports = { interactionPartners, breaker: client.breaker };
