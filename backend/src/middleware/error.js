const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

function notFound(req, _res, next) {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const isApiError = err instanceof ApiError;
    const status = isApiError ? err.statusCode : err.status || err.statusCode || 500;

    const payload = {
        error: {
            code: err.code || (status >= 500 ? 'INTERNAL' : 'ERROR'),
            message:
                status >= 500 && env.isProd ? 'Internal server error' : err.message || 'Unexpected error',
        },
        requestId: req.id,
    };
    if (err.details) payload.error.details = err.details;
    if (!env.isProd && status >= 500) payload.error.stack = err.stack;

    const log = req.log || logger;
    if (status >= 500) log.error({ err, requestId: req.id }, 'unhandled error');
    else log.warn({ code: payload.error.code, msg: err.message, requestId: req.id }, 'request error');

    res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
