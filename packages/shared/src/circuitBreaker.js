const logger = require('./logger');

/**
 * Minimal circuit breaker (CLOSED -> OPEN -> HALF_OPEN).
 *
 * Protects a service from hammering an external database that is already
 * failing, and gives fast, predictable failures to the caller (which can then
 * fall back to partial results) instead of piling up slow requests.
 */
const State = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

class CircuitBreaker {
    constructor(name, { failureThreshold = 5, coolDownMs = 30_000, halfOpenMax = 2 } = {}) {
        this.name = name;
        this.failureThreshold = failureThreshold;
        this.coolDownMs = coolDownMs;
        this.halfOpenMax = halfOpenMax;

        this.state = State.CLOSED;
        this.failures = 0;
        this.nextAttempt = 0;
        this.halfOpenCalls = 0;
    }

    canRequest() {
        if (this.state === State.CLOSED) return true;
        if (this.state === State.OPEN) {
            if (Date.now() >= this.nextAttempt) {
                this.state = State.HALF_OPEN;
                this.halfOpenCalls = 0;
                logger.warn({ breaker: this.name }, 'circuit half-open: probing upstream');
                return true;
            }
            return false;
        }
        return this.halfOpenCalls < this.halfOpenMax;
    }

    onSuccess() {
        this.failures = 0;
        if (this.state !== State.CLOSED) {
            logger.info({ breaker: this.name }, 'circuit closed: upstream recovered');
        }
        this.state = State.CLOSED;
        this.halfOpenCalls = 0;
    }

    onFailure() {
        this.failures += 1;
        if (this.state === State.HALF_OPEN || this.failures >= this.failureThreshold) {
            this.trip();
        }
    }

    trip() {
        this.state = State.OPEN;
        this.nextAttempt = Date.now() + this.coolDownMs;
        logger.error(
            { breaker: this.name, coolDownMs: this.coolDownMs },
            'circuit opened: upstream considered down'
        );
    }

    snapshot() {
        return { name: this.name, state: this.state, failures: this.failures };
    }
}

module.exports = { CircuitBreaker, State };
