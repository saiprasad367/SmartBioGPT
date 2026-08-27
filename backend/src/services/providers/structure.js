const { createHttpClient } = require('../../utils/httpClient');
const uniprot = require('./uniprot');
const ApiError = require('../../utils/ApiError');

const rcsb = createHttpClient('rcsb', { baseURL: 'https://data.rcsb.org' });

const isPdbId = (s) => /^[0-9][A-Za-z0-9]{3}$/.test(s);
const isUniprotAccession = (s) => /^[A-NR-Z0-9][0-9][A-Z0-9]{3}[0-9]([A-Z0-9]{4}[0-9])?$/i.test(s);

/**
 * Resolve any identifier (PDB id, UniProt accession, or gene symbol) to a
 * concrete, loadable 3D structure:
 *   1. experimental PDB coordinates from RCSB, else
 *   2. the AlphaFold predicted model (mmCIF).
 */
async function resolve(identifier) {
    const id = identifier.trim();

    if (isPdbId(id)) {
        return {
            source: 'pdb',
            id: id.toUpperCase(),
            format: 'pdb',
            url: `https://files.rcsb.org/download/${id.toUpperCase()}.pdb`,
            provider: 'RCSB PDB',
        };
    }

    let accession = id;
    let pdbIds = [];

    if (isUniprotAccession(id)) {
        try {
            const entry = await uniprot.search(id);
            accession = entry.accession;
            pdbIds = entry.structure?.pdbIds || [];
        } catch {
            /* fall through to AlphaFold */
        }
    } else {
        // treat as gene/protein name
        const entry = await uniprot.search(id);
        accession = entry.accession;
        pdbIds = entry.structure?.pdbIds || [];
    }

    if (pdbIds.length) {
        const best = await pickBestPdb(pdbIds);
        return {
            source: 'pdb',
            id: best,
            format: 'pdb',
            url: `https://files.rcsb.org/download/${best}.pdb`,
            provider: 'RCSB PDB',
            accession,
            alternatives: pdbIds,
        };
    }

    if (accession) {
        return {
            source: 'alphafold',
            id: accession,
            format: 'mmcif',
            url: `https://alphafold.ebi.ac.uk/files/AF-${accession}-F1-model_v4.cif`,
            provider: 'AlphaFold DB',
            accession,
        };
    }

    throw ApiError.notFound(`No 3D structure could be resolved for "${identifier}"`);
}

/** Prefer the PDB entry with the best (lowest) resolution, cheaply. */
async function pickBestPdb(pdbIds) {
    const candidates = pdbIds.slice(0, 4);
    const scored = await Promise.allSettled(
        candidates.map(async (pid) => {
            const res = await rcsb.get(`/rest/v1/core/entry/${pid}`);
            const resolution = res.data?.rcsb_entry_info?.resolution_combined?.[0] ?? 999;
            return { pid, resolution };
        })
    );
    const ok = scored.filter((s) => s.status === 'fulfilled').map((s) => s.value);
    if (!ok.length) return candidates[0];
    ok.sort((a, b) => a.resolution - b.resolution);
    return ok[0].pid;
}

module.exports = { resolve, breaker: rcsb.breaker };
