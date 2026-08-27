const { createClient } = require('@supabase/supabase-js');
const env = require('./env');
const logger = require('./logger');

/**
 * Two clients, by design:
 *
 *  - `supabaseAuth`  : anon key. Used for sign-in / sign-up and for verifying
 *                      a caller's JWT (`auth.getUser(token)`).
 *  - `supabaseAdmin` : service-role key. Used for all privileged DB reads/writes
 *                      on behalf of an already-authenticated user. Never exposed
 *                      to the client. Falls back to the anon client in local dev
 *                      if the service key is not set (RLS then applies).
 *
 * Both are stateless HTTP clients, so the API stays horizontally scalable.
 */
const commonOptions = { auth: { persistSession: false, autoRefreshToken: false } };

const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, commonOptions);

let supabaseAdmin;
if (env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, commonOptions);
} else {
    logger.warn('SUPABASE_SERVICE_ROLE_KEY not set - falling back to anon client for DB writes (RLS enforced).');
    supabaseAdmin = supabaseAuth;
}

module.exports = { supabaseAuth, supabaseAdmin };
