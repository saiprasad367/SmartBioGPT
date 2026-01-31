const axios = require('axios');

// @desc    Get 3D Structure URL
// @route   GET /structure/:proteinId
// @access  Private
const getStructure = async (req, res) => {
    const { proteinId } = req.params;

    // Logic:
    // 1. If it's a PDB ID (4 chars), construct PDB URL.
    // 2. If it's a UniProt ID, construct AlphaFold URL.
    // For simplicity, we try to guess or just return both possibilities if unsure.
    // AlphaFold is usually "AF-[UniProtID]-F1-model_v4.pdb"

    // We can verify existence effectively by checking if the URL is reachable HEAD,
    // but for speed we will construct the likely URL.

    try {
        // Assuming proteinId is a UniProt Accession usually for AlphaFold
        const alphaFoldUrl = `https://alphafold.ebi.ac.uk/files/AF-${proteinId}-F1-model_v4.pdb`;
        const pdbUrl = `https://files.rcsb.org/download/${proteinId}.pdb`; // If it's PDB ID

        // Determine type (basic heuristic)
        let type = 'alphafold';
        let downloadUrl = alphaFoldUrl;

        if (proteinId.length === 4) {
            type = 'pdb';
            downloadUrl = pdbUrl;
        }

        res.json({
            proteinId,
            type,
            url: downloadUrl
        });

    } catch (error) {
        res.status(500).json({ message: 'Error determining structure URL' });
    }
};

module.exports = {
    getStructure
};
