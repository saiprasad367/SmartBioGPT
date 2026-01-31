const axios = require('axios');

// External API Base URLs
const UNIPROT_API_URL = 'https://rest.uniprot.org/uniprotkb/search';
const STRING_DB_URL = 'https://string-db.org/api/json/network';

/**
 * Fetch and aggregate biological data
 * @param {string} query - Gene or Protein name (e.g., TP53)
 */
const fetchBioData = async (query) => {
    try {
        // 1. Search UniProt for the protein/gene
        // querying for human by default if generic, or just general search
        // Using fields to limit response size
        const uniprotUrl = `${UNIPROT_API_URL}?query=${query}&format=json&size=1`;
        const uniprotRes = await axios.get(uniprotUrl);

        if (!uniprotRes.data.results || uniprotRes.data.results.length === 0) {
            throw new Error('Protein not found');
        }

        const proteinData = uniprotRes.data.results[0];
        const primaryAccession = proteinData.primaryAccession;
        const geneName = proteinData.genes?.[0]?.geneName?.value;
        const organism = proteinData.organism?.scientificName;

        // Extract PDB IDs from cross-references
        const pdbRefs = proteinData.uniProtKBCrossReferences
            ?.filter((ref) => ref.database === 'PDB')
            .map((ref) => ref.id)
            .slice(0, 5); // Take top 5

        // 2. Fetch Interactions from STRING DB (Parallel if we had more, but depend on ID here)
        let stringInteractions = [];
        if (primaryAccession) {
            try {
                const stringUrl = `${STRING_DB_URL}?identifiers=${primaryAccession}&limit=5`;
                const stringRes = await axios.get(stringUrl);
                stringInteractions = stringRes.data;
            } catch (err) {
                console.error('STRING DB Error:', err.message);
                // Non-critical, continue
            }
        }

        // 3. Fetch ChEMBL Data (Target Details)
        let chemblData = {};
        if (primaryAccession) {
            try {
                // Search ChEMBL Target by UniProt Accession
                const chemblUrl = `https://www.ebi.ac.uk/chembl/api/data/target?target_components__accession=${primaryAccession}&format=json`;
                const chemblRes = await axios.get(chemblUrl);
                if (chemblRes.data.targets && chemblRes.data.targets.length > 0) {
                    chemblData = chemblRes.data.targets[0];
                }
            } catch (chemblErr) {
                console.error('ChEMBL API Error:', chemblErr.message);
            }
        }

        // 4. Structure the final response
        return {
            name: geneName || query,
            accession: primaryAccession,
            organism: organism,
            description: proteinData.proteinDescription?.recommendedName?.fullName?.value,
            function: proteinData.comments?.find(c => c.commentType === 'FUNCTION')?.texts?.[0]?.value || 'No function description available.',
            structure: {
                pdbIds: pdbRefs || [],
                alphaFoldUrl: `https://alphafold.ebi.ac.uk/entry/${primaryAccession}`,
            },
            interactions: stringInteractions,
            chembl: chemblData // Add ChEMBL data
        };
    } catch (error) {
        console.error('BioService Error:', error.message);
        throw error;
    }
};

module.exports = {
    fetchBioData,
};
