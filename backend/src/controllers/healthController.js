const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { supabaseAuth } = require('../config/supabase');
const bioService = require('../services/bioService');
const uniprot = require('../services/providers/uniprot');
const chembl = require('../services/providers/chembl');
const stringdb = require('../services/providers/stringdb');
const structure = require('../services/providers/structure');

const startedAt = Date.now();

/** Liveness: is the process up? Cheap, no external calls. */
const live = (_req, res) => {
    res.json({ status: 'ok', uptimeSeconds: Math.round((Date.now() - startedAt) / 1000) });
};

/** Readiness: can we actually serve traffic? Checks the critical dependency (DB). */
const ready = asyncHandler(async (_req, res) => {
    let db = 'ok';
    try {
        const { error } = await supabaseAuth.from('chats').select('id').limit(1);
        if (error && !/permission|rls|row-level/i.test(error.message)) db = 'degraded';
    } catch {
        db = 'down';
    }
    const ok = db !== 'down';
    res.status(ok ? 200 : 503).json({ status: ok ? 'ready' : 'not-ready', checks: { db } });
});

/** Rich status for humans / dashboards: breaker states + cache stats. */
const status = (_req, res) => {
    res.json({
        service: 'smart-bio-gpt-api',
        env: env.NODE_ENV,
        uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
        features: { ai: env.aiEnabled, mail: env.mailEnabled },
        cache: { bio: bioService.cacheStats() },
        circuitBreakers: [
            uniprot.breaker.snapshot(),
            chembl.breaker.snapshot(),
            stringdb.breaker.snapshot(),
            structure.breaker.snapshot(),
        ],
    });
};

module.exports = { live, ready, status };
