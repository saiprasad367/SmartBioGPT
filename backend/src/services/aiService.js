const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || 'sk-dummy-key', // Prevent crash on missing key
    baseURL: 'https://openrouter.ai/api/v1',
});

const generateChatResponse = async (messages, contextData = null) => {
    try {
        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error("Missing API Key");
        }

        const systemMessage = {
            role: 'system',
            content: `You are Smart Bio GPT. 
IMPORTANT INSTRUCTIONS:
1. Explain difficult biology concepts in **Simple English**.
2. Use **Bullet Points** for every answer.
3. Keep paragraphs short (1-2 sentences).
4. Use the provided ChEMBL data to mention drug targets or bioactivities if available.
5. **PLAIN TEXT ONLY**. Do not use asterisks (** or *) or markdown bolding. Do not use underscores. Just write clear, plain text.
${contextData ? `Context: ${JSON.stringify(contextData)}` : ''}`
        };

        const completion = await openai.chat.completions.create({
            model: 'google/gemini-2.0-flash-001',
            messages: [systemMessage, ...messages],
        });

        // Forced Cleanup: Remove any remaining asterisks or bolding
        let cleanText = completion.choices[0].message.content;
        cleanText = cleanText.replace(/\*\*/g, '').replace(/\*/g, ''); // Remove ** and *
        cleanText = cleanText.replace(/#/g, ''); // Remove markdown headers if any

        return cleanText;

    } catch (error) {
        console.error('AI Service Error:', error.message);

        // SMART FALLBACK: Generate a scientific response based on Bio Data
        if (contextData) {
            const pName = contextData.name || contextData.accession || "This Protein";
            const organism = contextData.organism || "Unknown Organism";
            const func = contextData.function ? contextData.function.substring(0, 150) + "..." : "essential biological functions.";

            let analysis = `### Analysis of ${pName}
        
**Biological Function:**
*   ${pName} is found in *${organism}*.
*   It is associated with **${func}**.`;

            // Integrate ChEMBL Data if available
            if (contextData.chembl && contextData.chembl.pref_name) {
                analysis += `\n\n**Drug Targets (ChEMBL):**
*   Target Type: ${contextData.chembl.target_type}
*   Preferred Name: ${contextData.chembl.pref_name}`;
            }

            analysis += `\n\n**Structure:**
*   3D Viewer is ready (PDB).
*   Check surface for details.

**Recommendations:**
*   Review literature for drug targets.`;

            return analysis;
        }

        return "I am unable to connect to the global AI network. The protein structure should be visible on the right.";
    }
};

module.exports = {
    generateChatResponse,
};
