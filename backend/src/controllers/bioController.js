const bioService = require('../services/bioService');
const { z } = require('zod');

// @desc    Search for biological data
// @route   POST /bio/search
// @access  Private (or Public based on requirements, plan says Protected)
const searchBioData = async (req, res) => {
    const searchSchema = z.object({
        query: z.string().min(2, 'Search query must be at least 2 characters'),
    });

    try {
        const validatedData = searchSchema.parse(req.body);
        const { query } = validatedData;

        const data = await bioService.fetchBioData(query);

        res.json(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors[0].message });
        } else if (error.message === 'Protein not found') {
            res.status(404).json({ message: 'Protein not found' });
        } else {
            res.status(500).json({ message: 'Server Error fetching bio data' });
        }
    }
};

module.exports = {
    searchBioData,
};
