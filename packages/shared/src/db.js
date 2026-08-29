const { Pool } = require('pg');
const logger = require('./logger');

/**
 * Shared Postgres connection pool. One pool per process; every service that
 * needs persistence imports this. Connection details come from DATABASE_URL
 * (e.g. postgres://user:pass@postgres:5432/smartbiogpt).
 */
let pool;

function getPool() {
    if (pool) return pool;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set - this service requires Postgres');
    }

    pool = new Pool({
        connectionString,
        max: Number(process.env.PG_POOL_MAX) || 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    pool.on('error', (err) => logger.error({ err: err.message }, 'idle pg client error'));
    return pool;
}

/** Parameterised query helper. Always use $1, $2 placeholders - never string concat. */
async function query(text, params) {
    const start = Date.now();
    const res = await getPool().query(text, params);
    const ms = Date.now() - start;
    if (ms > 500) logger.warn({ ms, text: text.slice(0, 80) }, 'slow query');
    return res;
}

/** Run a set of statements inside a single transaction. */
async function withTransaction(fn) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

async function healthcheck() {
    try {
        await getPool().query('SELECT 1');
        return 'ok';
    } catch {
        return 'down';
    }
}

async function close() {
    if (pool) await pool.end().catch(() => {});
    pool = undefined;
}

module.exports = { getPool, query, withTransaction, healthcheck, close };
