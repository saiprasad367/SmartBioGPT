const { createHttpClient } = require('../httpClient');

const client = createHttpClient('chembl', { baseURL: 'https://www.ebi.ac.uk/chembl/api/data' });

/**
 * Supplementary target annotation from ChEMBL, keyed by UniProt accession.
 * Non-critical: callers treat a rejection here as "no ChEMBL data".
 */
async function targetByAccession(accession) {
    const res = await client.get(
        `/target?target_components__accession=${encodeURIComponent(accession)}&format=json&limit=1`
    );
    const target = res.data?.targets?.[0];
    if (!target) return null;

    return {
        targetChemblId: target.target_chembl_id,
        prefName: target.pref_name,
        targetType: target.target_type,
        organism: target.organism,
    };
}

module.exports = { targetByAccession, breaker: client.breaker };
