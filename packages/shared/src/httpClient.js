const axios = require('axios');
const logger = require('./logger');
const ApiError = require('./ApiError');
const { CircuitBreaker } = require('./circuitBreaker');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const DEFAULT_TIMEOUT = Number(process.env.HTTP_TIMEOUT_MS) || 12000;
const DEFAULT_RETRIES = Number.isFinite(Number(process.env.HTTP_RETRIES))
    ? Number(process.env.HTTP_RETRIES)
    : 2;

/**
 * Build a resilient HTTP client bound to one external provider.
 *
 * Every provider (UniProt, RCSB, ChEMBL, STRING, an internal service, ...) gets
 * its own instance so that a failure in one does not open the breaker for the
 * others. Per-provider timeout, bounded exponential backoff with jitter on
 * transient failures, and a circuit breaker that short-circuits calls while the
 * upstream is down.
 */
function createHttpClient(
    name,
    { baseURL, timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, headers } = {}
) {
    const instance = axios.create({
        baseURL,
        timeout,
        headers: { Accept: 'application/json', 'User-Agent': 'SmartBioGPT/1.0 (+research)', ...headers },
    });

    const breaker = new CircuitBreaker(name, { failureThreshold: 5, coolDownMs: 30_000 });

    async function request(config) {
        if (!breaker.canRequest()) {
            throw ApiError.unavailable(`${name} is temporarily unavailable`, { code: 'CIRCUIT_OPEN' });
        }

        let attempt = 0;
        for (;;) {
            try {
                const res = await instance.request(config);
                breaker.onSuccess();
                return res;
            } catch (err) {
                const status = err.response?.status;
                const transient = !status || RETRYABLE_STATUS.has(status) || err.code === 'ECONNABORTED';

                if (transient) breaker.onFailure();
                else breaker.onSuccess(); // a 404/400 means the upstream is healthy

                if (!transient || attempt >= retries) {
                    logger.warn(
                        { provider: name, url: config.url, status, code: err.code, attempt },
                        'upstream request failed'
                    );
                    throw normalizeError(name, err);
                }

                attempt += 1;
                const backoff = Math.min(2000 * 2 ** (attempt - 1), 8000) + Math.random() * 250;
                logger.debug({ provider: name, url: config.url, attempt, backoff }, 'retrying upstream');
                await sleep(backoff);
            }
        }
    }

    function normalizeError(provider, err) {
        const status = err.response?.status;
        if (status === 404) return ApiError.notFound(`${provider}: resource not found`, { cause: err });
        if (status === 429) return ApiError.tooMany(`${provider}: rate limited`, { cause: err });
        return ApiError.upstream(`${provider}: request failed`, {
            code: 'UPSTREAM_ERROR',
            details: { status, code: err.code },
            cause: err,
        });
    }

    return {
        name,
        get: (url, config) => request({ ...config, method: 'get', url }),
        post: (url, data, config) => request({ ...config, method: 'post', url, data }),
        breaker,
    };
}

module.exports = { createHttpClient };
