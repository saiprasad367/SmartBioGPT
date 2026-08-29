const { LRUCache } = require('lru-cache');
const logger = require('./logger');
const { getRedis } = require('./redis');

/**
 * Two-tier cache with a stable async, Redis-shaped interface.
 *
 *   L1: process-local LRU (fast, bounded)
 *   L2: shared Redis (survives restarts, shared across replicas)
 *
 * Values must be JSON-serialisable. A failing producer is never cached.
 * If Redis is down the cache degrades to L1-only rather than failing the call.
 */
class Cache {
    constructor({ namespace = 'sbg', max = 2000, ttlMs } = {}) {
        this.namespace = namespace;
        this.ttlMs = ttlMs || 6 * 60 * 60 * 1000;
        this.l1 = new LRUCache({ max, ttl: this.ttlMs });
        this.hits = 0;
        this.misses = 0;
    }

    _key(key) {
        return `${this.namespace}:${key}`;
    }

    async get(key) {
        const nk = this._key(key);
        const local = this.l1.get(nk);
        if (local !== undefined) {
            this.hits += 1;
            return local;
        }
        const redis = getRedis();
        if (redis) {
            try {
                const raw = await redis.get(nk);
                if (raw != null) {
                    const value = JSON.parse(raw);
                    this.l1.set(nk, value);
                    this.hits += 1;
                    return value;
                }
            } catch (err) {
                logger.debug({ err: err.message }, 'redis get failed');
            }
        }
        this.misses += 1;
        return undefined;
    }

    async set(key, value, ttlMs = this.ttlMs) {
        const nk = this._key(key);
        this.l1.set(nk, value, { ttl: ttlMs });
        const redis = getRedis();
        if (redis) {
            try {
                await redis.set(nk, JSON.stringify(value), 'PX', ttlMs);
            } catch (err) {
                logger.debug({ err: err.message }, 'redis set failed');
            }
        }
    }

    async delete(key) {
        const nk = this._key(key);
        this.l1.delete(nk);
        const redis = getRedis();
        if (redis) await redis.del(nk).catch(() => {});
    }

    /** Cache-aside: return the cached value or compute + store it. */
    async wrap(key, producer, ttlMs) {
        const cached = await this.get(key);
        if (cached !== undefined) {
            logger.debug({ key }, 'cache hit');
            return cached;
        }
        const value = await producer();
        if (value !== undefined && value !== null) await this.set(key, value, ttlMs);
        return value;
    }

    stats() {
        const total = this.hits + this.misses;
        return {
            l1Size: this.l1.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total ? Number((this.hits / total).toFixed(3)) : 0,
        };
    }
}

module.exports = { Cache };
