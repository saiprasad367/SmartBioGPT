const { validate, z } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const structureProvider = require('../services/providers/structure');

/**
 * GET /api/structure/:identifier
 * Resolve a PDB id / UniProt accession / gene symbol to a loadable 3D model
 * (experimental PDB when available, otherwise the AlphaFold prediction).
 */
const getStructure = asyncHandler(async (req, res) => {
    const resolved = await structureProvider.resolve(req.params.identifier);
    res.json({ data: resolved });
});

module.exports = {
    getStructure: [
        validate({ params: z.object({ identifier: z.string().trim().min(2).max(120) }) }),
        getStructure,
    ],
};
