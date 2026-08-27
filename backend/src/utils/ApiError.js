/**
 * Operational error with an HTTP status. Anything thrown that is NOT an
 * ApiError is treated as an unexpected bug by the error handler (500 + logged).
 */
class ApiError extends Error {
    constructor(statusCode, message, { code, details, cause } = {}) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code || httpCode(statusCode);
        this.details = details;
        this.isOperational = true;
        if (cause) this.cause = cause;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(msg = 'Bad request', opts) {
        return new ApiError(400, msg, opts);
    }
    static unauthorized(msg = 'Authentication required', opts) {
        return new ApiError(401, msg, opts);
    }
    static forbidden(msg = 'Forbidden', opts) {
        return new ApiError(403, msg, opts);
    }
    static notFound(msg = 'Not found', opts) {
        return new ApiError(404, msg, opts);
    }
    static conflict(msg = 'Conflict', opts) {
        return new ApiError(409, msg, opts);
    }
    static tooMany(msg = 'Too many requests', opts) {
        return new ApiError(429, msg, opts);
    }
    static upstream(msg = 'Upstream service error', opts) {
        return new ApiError(502, msg, opts);
    }
    static unavailable(msg = 'Service temporarily unavailable', opts) {
        return new ApiError(503, msg, opts);
    }
}

function httpCode(status) {
    return (
        {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            429: 'RATE_LIMITED',
            500: 'INTERNAL',
            502: 'UPSTREAM_ERROR',
            503: 'UNAVAILABLE',
        }[status] || 'ERROR'
    );
}

module.exports = ApiError;
