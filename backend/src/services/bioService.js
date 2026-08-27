const env = require('../config/env');
const logger = require('../config/logger');
const { TtlCache } = require('../utils/cache');
const uniprot = require('./providers/uniprot');
const chembl = require('./providers/chembl');
const stringdb = require('./providers/stringdb');
const structureProvider = require('./providers/structure');

const cache = new TtlCache({ max: 2000, ttl: env.BIO_CACHE_TTL_MS });

/**
 * Aggregate a normalized "protein dossier" from several public databases.
 *
 * Design: UniProt is the spine (required). Every enrichment call runs
 * concurrently and independently via `allSettled`, so STRING or ChEMBL being
 * down only removes that section - the researcher still gets a useful result.
 */
async function getProteinDossier(query) {
    const key = `dossier:${query.trim().toLowerCase()}`;

    return cache.wrap(key, async () => {
        const core = await uniprot.search(query); // throws 404 if truly not found

        const [chemblRes, stringRes, structureRes] = await Promise.allSettled([
            chembl.targetByAccession(core.accession),
            stringdb.interactionPartners(core.accession, core.taxonId),
            structureProvider.resolve(core.accession),
        ]);

        const settled = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);
        if (chemblRes.status === 'rejected')
            logger.debug({ err: chemblRes.reason?.message }, 'chembl enrichment skipped');
        if (stringRes.status === 'rejected')
            logger.debug({ err: stringRes.reason?.message }, 'string enrichment skipped');

        const stringPartners = settled(stringRes, []);
        const structure = settled(structureRes, null);

        return {
            query,
            accession: core.accession,
            name: core.name,
            gene: core.gene,
            geneSynonyms: core.geneSynonyms,
            organism: core.organism,
            taxonId: core.taxonId,
            length: core.length,
            sequence: core.sequence,
            function: core.function,
            keywords: core.keywords,
            diseases: core.diseases,
            drugs: core.drugs,
            interactions: mergeInteractions(core.interactions, stringPartners),
            chembl: settled(chemblRes, null),
            structure: structure
                ? {
                      source: structure.source,
                      id: structure.id,
                      format: structure.format,
                      url: structure.url,
                      provider: structure.provider,
                      pdbIds: core.structure.pdbIds,
                      alphaFoldId: core.structure.alphaFoldId,
                  }
                : {
                      source: null,
                      pdbIds: core.structure.pdbIds,
                      alphaFoldId: core.structure.alphaFoldId,
                  },
            sources: [
                'UniProt',
                stringPartners.length && 'STRING',
                chemblRes.status === 'fulfilled' && chemblRes.value && 'ChEMBL',
                structure && structure.provider,
            ].filter(Boolean),
            retrievedAt: new Date().toISOString(),
        };
    });
}

function mergeInteractions(uniprotInteractions, stringPartners) {
    const seen = new Set();
    const out = [];
    for (const i of uniprotInteractions || []) {
        const k = (i.partner || '').toLowerCase();
        if (k && !seen.has(k)) {
            seen.add(k);
            out.push({ partner: i.partner, accession: i.accession, source: 'UniProt', score: null });
        }
    }
    for (const s of stringPartners || []) {
        const k = (s.partner || '').toLowerCase();
        if (k && !seen.has(k)) {
            seen.add(k);
            out.push({ partner: s.partner, accession: null, source: 'STRING', score: s.score });
        }
    }
    return out.slice(0, 20);
}

function cacheStats() {
    return cache.stats();
}

module.exports = { getProteinDossier, cacheStats };
