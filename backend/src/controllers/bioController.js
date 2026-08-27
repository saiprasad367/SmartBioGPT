const { validate, z } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const bioService = require('../services/bioService');
const repository = require('../services/repository');
const logger = require('../config/logger');

const searchSchema = {
    body: z.object({
        query: z.string().trim().min(2, 'Search query must be at least 2 characters').max(120),
    }),
};

const search = asyncHandler(async (req, res) => {
    const { query } = req.body;
    const dossier = await bioService.getProteinDossier(query);

    if (req.user) {
        repository
            .recordSearch(req.user.id, { query, accession: dossier.accession })
            .catch((err) => logger.debug({ err: err.message }, 'recordSearch skipped'));
    }

    res.json({ data: dossier });
});

const getByAccession = asyncHandler(async (req, res) => {
    const dossier = await bioService.getProteinDossier(req.params.accession);
    res.json({ data: dossier });
});

module.exports = {
    search: [validate(searchSchema), search],
    getByAccession: [
        validate({ params: z.object({ accession: z.string().trim().min(2).max(120) }) }),
        getByAccession,
    ],
};
