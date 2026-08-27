const { LRUCache } = require('lru-cache');
const logger = require('../config/logger');

/**
 * Process-local TTL cache with a stable async interface.
 *
 * The interface (`get`, `set`, `wrap`) is deliberately Redis-shaped: swapping in
 * a shared cache later (for a multi-node deployment) means re-implementing this
 * module only, not its callers. Until then, each node keeps its own copy — which
 * is safe here because every cached value is derived purely from public,
 * slow-moving reference data (UniProt / PDB / ChEMBL).
 */
class TtlCache {
    constructor({ max = 1000, ttl } = {}) {
        this.store = new LRUCache({ max, ttl, ttlAutopurge: false });
        this.hits = 0;
        this.misses = 0;
    }

    async get(key) {
        const v = this.store.get(key);
        if (v === undefined) this.misses += 1;
        else this.hits += 1;
        return v;
    }

    async set(key, value, ttl) {
        this.store.set(key, value, ttl ? { ttl } : undefined);
    }

    async delete(key) {
        this.store.delete(key);
    }

    /**
     * Cache-aside helper: return the cached value or compute + store it.
     * A failing producer is never cached.
     */
    async wrap(key, producer, ttl) {
        const cached = await this.get(key);
        if (cached !== undefined) {
            logger.debug({ key }, 'cache hit');
            return cached;
        }
        const value = await producer();
        if (value !== undefined && value !== null) await this.set(key, value, ttl);
        return value;
    }

    stats() {
        const total = this.hits + this.misses;
        return {
            size: this.store.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total ? Number((this.hits / total).toFixed(3)) : 0,
        };
    }
}

module.exports = { TtlCache };
