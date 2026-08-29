const { createHttpClient } = require('../httpClient');
const ApiError = require('../ApiError');

const client = createHttpClient('uniprot', { baseURL: 'https://rest.uniprot.org' });

const FIELDS = [
    'accession',
    'id',
    'protein_name',
    'gene_names',
    'organism_name',
    'organism_id',
    'length',
    'sequence',
    'cc_function',
    'cc_disease',
    'cc_interaction',
    'xref_pdb',
    'xref_alphafolddb',
    'xref_drugbank',
    'keyword',
].join(',');

function pickText(comments, type) {
    const c = comments?.find((x) => x.commentType === type);
    return c?.texts?.[0]?.value || null;
}

function parseEntry(entry) {
    const comments = entry.comments || [];
    const xrefs = entry.uniProtKBCrossReferences || [];

    const diseases = comments
        .filter((c) => c.commentType === 'DISEASE' && c.disease)
        .map((c) => ({
            id: c.disease.diseaseId,
            acronym: c.disease.acronym || null,
            description: c.disease.description || null,
        }));

    const drugs = xrefs
        .filter((x) => x.database === 'DrugBank')
        .map((x) => {
            const name = x.properties?.find((p) => p.key === 'GenericName')?.value;
            return { id: x.id, name: name || x.id };
        });

    const pdbIds = xrefs
        .filter((x) => x.database === 'PDB')
        .map((x) => x.id)
        .slice(0, 8);

    const alphaFoldId =
        xrefs.find((x) => x.database === 'AlphaFoldDB')?.id || entry.primaryAccession || null;

    const interactions = comments
        .filter((c) => c.commentType === 'INTERACTION')
        .flatMap((c) => c.interactions || [])
        .map((i) => ({
            partner: i.interactantTwo?.geneName || i.interactantTwo?.uniProtKBAccession || null,
            accession: i.interactantTwo?.uniProtKBAccession || null,
            experiments: i.numberOfExperiments || null,
        }))
        .filter((i) => i.partner)
        .slice(0, 15);

    return {
        accession: entry.primaryAccession,
        entryId: entry.uniProtkbId,
        name:
            entry.proteinDescription?.recommendedName?.fullName?.value ||
            entry.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
            entry.uniProtkbId,
        gene: entry.genes?.[0]?.geneName?.value || null,
        geneSynonyms: (entry.genes?.[0]?.synonyms || []).map((s) => s.value),
        organism: entry.organism?.scientificName || null,
        taxonId: entry.organism?.taxonId || null,
        sequence: entry.sequence?.value || null,
        length: entry.sequence?.length || entry.sequence?.value?.length || null,
        function: pickText(comments, 'FUNCTION'),
        keywords: (entry.keywords || []).map((k) => k.name).slice(0, 12),
        diseases,
        drugs,
        interactions,
        structure: { pdbIds, alphaFoldId },
    };
}

const ACCESSION_RE = /^[A-NR-Z0-9][0-9][A-Z0-9]{3}[0-9]([A-Z0-9]{4}[0-9])?$/i;

async function runQuery(lucene, size = 1) {
    const res = await client.get(
        `/uniprotkb/search?query=${encodeURIComponent(lucene)}&format=json&size=${size}&fields=${FIELDS}`
    );
    return res.data?.results || [];
}

/**
 * Resolve a free-text query (gene symbol, protein name, or accession) to one
 * normalized UniProt entry. Ranked strategy so "TP53" returns TP53, not a
 * protein that merely mentions it.
 */
async function search(query) {
    const raw = query.trim();
    const strategies = [];

    if (ACCESSION_RE.test(raw)) strategies.push(`accession:${raw}`);
    strategies.push(`gene_exact:${raw} AND reviewed:true AND organism_id:9606`);
    strategies.push(`gene_exact:${raw} AND reviewed:true`);
    strategies.push(`(gene:${raw} OR protein_name:"${raw}") AND reviewed:true AND organism_id:9606`);
    strategies.push(`(gene:${raw} OR protein_name:"${raw}") AND reviewed:true`);
    strategies.push(`gene_exact:${raw}`);
    strategies.push(raw);

    let entry;
    for (const lucene of strategies) {
        // eslint-disable-next-line no-await-in-loop
        const results = await runQuery(lucene);
        if (results.length) {
            entry = results[0];
            break;
        }
    }

    if (!entry) throw ApiError.notFound(`No UniProt entry found for "${query}"`, { code: 'PROTEIN_NOT_FOUND' });

    return parseEntry(entry);
}

module.exports = { search, _parseEntry: parseEntry, breaker: client.breaker };
