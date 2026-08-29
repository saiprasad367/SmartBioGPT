const { asyncHandler, validate, z, bio } = require('@sbg/shared');
const { recordSearch } = require('./historyClient');

const search = asyncHandler(async (req, res) => {
    const { query } = req.body;
    const dossier = await bio.getProteinDossier(query);
    if (req.user) recordSearch(req.user.id, query, dossier.accession);
    res.json({ data: dossier });
});

const getByAccession = asyncHandler(async (req, res) => {
    const dossier = await bio.getProteinDossier(req.params.accession);
    res.json({ data: dossier });
});

const getStructure = asyncHandler(async (req, res) => {
    const resolved = await bio.structure.resolve(req.params.identifier);
    res.json({ data: resolved });
});

const status = (_req, res) => {
    res.json({
        service: 'bio-service',
        cache: bio.cacheStats(),
        circuitBreakers: [
            bio.uniprot.breaker.snapshot(),
            bio.chembl.breaker.snapshot(),
            bio.stringdb.breaker.snapshot(),
            bio.structure.breaker.snapshot(),
        ],
    });
};

const idParam = { params: z.object({ identifier: z.string().trim().min(2).max(120) }) };
const accessionParam = { params: z.object({ accession: z.string().trim().min(2).max(120) }) };

module.exports = {
    search: [
        validate({ body: z.object({ query: z.string().trim().min(2).max(120) }) }),
        search,
    ],
    getByAccession: [validate(accessionParam), getByAccession],
    getStructure: [validate(idParam), getStructure],
    status,
};
