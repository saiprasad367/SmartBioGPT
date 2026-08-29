const IORedis = require('ioredis');
const logger = require('./logger');

/**
 * Shared Redis client. Used for the distributed cache and for rate-limiter
 * state so multiple replicas of a service stay consistent. Optional: if
 * REDIS_URL is unset, callers fall back to in-process behaviour.
 */
let client;
let unavailable = false;

function getRedis() {
    if (client || unavailable) return client;

    const url = process.env.REDIS_URL;
    if (!url) {
        unavailable = true;
        logger.warn('REDIS_URL not set - running without a shared cache');
        return null;
    }

    client = new IORedis(url, {
        maxRetriesPerRequest: 2,
        // Queue commands issued before the socket is ready (e.g. rate-limit-redis
        // loading its Lua script at boot) instead of rejecting them. Compose
        // gates every service on `redis: service_healthy`, so this window is a
        // few milliseconds; callers (cache, healthcheck) already handle errors.
        enableOfflineQueue: true,
        lazyConnect: false,
        retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    client.on('error', (err) => logger.warn({ err: err.message }, 'redis error'));
    client.on('connect', () => logger.info('redis connected'));
    return client;
}

async function healthcheck() {
    const r = getRedis();
    if (!r) return 'disabled';
    try {
        await r.ping();
        return 'ok';
    } catch {
        return 'down';
    }
}

async function close() {
    if (client) await client.quit().catch(() => {});
    client = undefined;
}

module.exports = { getRedis, healthcheck, close };
