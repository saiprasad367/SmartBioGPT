const OpenAI = require('openai');
const logger = require('../logger');

const AI_ENABLED = Boolean(process.env.OPENROUTER_API_KEY);
const MODEL = process.env.OPENROUTER_MODEL || 'minimax/minimax-m3:free';
const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || 'http://localhost:8080';
const MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS) || 1200;

/**
 * OpenRouter fallback chain: if the primary model is rate-limited (429) or out
 * of credits (402), OpenRouter automatically routes to the next one. Extra
 * entries beyond MODEL are free models with different upstream providers.
 */
const FALLBACK_MODELS = [
    ...new Set([
        MODEL,
        ...String(process.env.OPENROUTER_FALLBACK_MODELS || 'nvidia/nemotron-3-super-120b-a12b:free')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    ]),
];

const openai = AI_ENABLED
    ? new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: BASE_URL,
          defaultHeaders: { 'HTTP-Referer': APP_PUBLIC_URL, 'X-Title': 'Smart Bio GPT' },
          timeout: 45_000,
          maxRetries: 2,
      })
    : null;

const SYSTEM_PROMPT = `You are Smart Bio GPT, a research assistant for molecular biologists and drug-discovery researchers.

Guidelines:
- Be precise and cite the mechanism, not just the name. Prefer specifics (residues, pathways, complexes) over generalities.
- Use Markdown: short paragraphs, bullet lists, and **bold** for key terms. Use tables when comparing.
- When structured protein data is provided in context, ground your answer in it and call out what is known vs. inferred.
- If asked about clinical claims, note the evidence level. Never invent citations, PDB IDs, or numbers.
- End substantive answers with a short "Next steps" list of concrete research actions when useful.`;

/**
 * @param {Array<{role:string, content:string}>} history  ordered oldest -> newest
 * @param {object|null} contextData  normalized protein dossier for the active protein
 */
async function generateChatResponse(history, contextData = null) {
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (contextData) {
        messages.push({
            role: 'system',
            content:
                'Active protein context (authoritative, from public databases):\n' +
                JSON.stringify(compactContext(contextData)),
        });
    }

    for (const m of history) {
        if (m.role === 'user' || m.role === 'assistant') {
            messages.push({ role: m.role, content: String(m.content).slice(0, 8000) });
        }
    }

    if (!openai) return { content: fallbackResponse(history, contextData), degraded: true };

    try {
        const completion = await openai.chat.completions.create({
            model: FALLBACK_MODELS[0],
            models: FALLBACK_MODELS.length > 1 ? FALLBACK_MODELS : undefined,
            messages,
            temperature: 0.3,
            max_tokens: MAX_TOKENS,
        });
        const content = completion.choices?.[0]?.message?.content?.trim();
        if (!content) throw new Error('empty completion');
        return { content, degraded: false, model: completion.model || FALLBACK_MODELS[0] };
    } catch (err) {
        logger.error({ err: err.message }, 'AI provider call failed - using deterministic fallback');
        return { content: fallbackResponse(history, contextData), degraded: true };
    }
}

function compactContext(d) {
    return {
        name: d.name,
        gene: d.gene,
        accession: d.accession,
        organism: d.organism,
        function: d.function,
        diseases: (d.diseases || []).map((x) => x.id || x).slice(0, 8),
        drugs: (d.drugs || []).map((x) => x.name || x).slice(0, 10),
        interactions: (d.interactions || []).map((x) => x.partner).slice(0, 12),
        keywords: d.keywords,
        structure: d.structure && { source: d.structure.source, id: d.structure.id },
    };
}

function fallbackResponse(history, d) {
    const lastUser = [...history].reverse().find((m) => m.role === 'user')?.content || 'your question';
    if (!d) {
        return `The AI service is not reachable right now, so here is a grounded starting point instead.

**On "${lastUser}"** — search a specific gene or protein (e.g. \`TP53\`, \`BRCA1\`, \`EGFR\`) to load its dossier, then ask again. Once a protein is active I can reason over its function, disease links, known drugs, and interaction partners.`;
    }
    const lines = [];
    lines.push(`## ${d.name}${d.gene ? ` (${d.gene})` : ''}`);
    if (d.organism) lines.push(`*Organism:* ${d.organism} • *Accession:* ${d.accession}`);
    if (d.function) lines.push(`\n**Function**\n${d.function}`);
    if (d.diseases?.length)
        lines.push(`\n**Disease associations**\n${d.diseases.map((x) => `- ${x.id}`).join('\n')}`);
    if (d.drugs?.length)
        lines.push(`\n**Known drugs (DrugBank)**\n${d.drugs.map((x) => `- ${x.name}`).join('\n')}`);
    if (d.interactions?.length)
        lines.push(`\n**Interaction partners**\n${d.interactions.map((x) => `- ${x.partner}`).join('\n')}`);
    lines.push(`\n*(Generated offline from database records; AI narrative unavailable.)*`);
    return lines.join('\n');
}

module.exports = { generateChatResponse, AI_ENABLED, MODEL };
