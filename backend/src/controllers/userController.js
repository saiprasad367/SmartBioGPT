const { validate, z } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const repository = require('../services/repository');

const getFavorites = asyncHandler(async (req, res) => {
    res.json({ data: await repository.listFavorites(req.user.id) });
});

const addFavorite = asyncHandler(async (req, res) => {
    const fav = await repository.addFavorite(req.user.id, req.body);
    res.status(201).json({ data: fav });
});

const removeFavorite = asyncHandler(async (req, res) => {
    await repository.removeFavorite(req.user.id, req.params.accession);
    res.status(204).send();
});

const getHistory = asyncHandler(async (req, res) => {
    res.json({ data: await repository.listSearchHistory(req.user.id) });
});

module.exports = {
    getFavorites,
    addFavorite: [
        validate({
            body: z.object({
                accession: z.string().trim().min(2).max(120),
                name: z.string().trim().max(200).optional(),
                gene: z.string().trim().max(60).optional(),
                organism: z.string().trim().max(120).optional(),
            }),
        }),
        addFavorite,
    ],
    removeFavorite: [
        validate({ params: z.object({ accession: z.string().trim().min(2).max(120) }) }),
        removeFavorite,
    ],
    getHistory,
};
