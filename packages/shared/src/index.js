'use strict';

/**
 * @sbg/shared - the common library behind every Smart Bio GPT microservice.
 *
 *   infra   : logger, db (pg), redis, cache, httpClient, circuitBreaker
 *   web     : ApiError, asyncHandler, validate, error + auth middleware,
 *             rate limiters, createApp / startServer
 *   domain  : bio (providers + dossier aggregation), ai (chat), data (pg
 *             repositories), auth (google, email)
 */

module.exports = {
    // infra
    logger: require('./logger'),
    db: require('./db'),
    redis: require('./redis'),
    Cache: require('./cache').Cache,
    createHttpClient: require('./httpClient').createHttpClient,
    CircuitBreaker: require('./circuitBreaker').CircuitBreaker,

    // web
    ApiError: require('./ApiError'),
    asyncHandler: require('./asyncHandler'),
    ...require('./validate'), // validate, z
    ...require('./errorMiddleware'), // notFound, errorHandler
    ...require('./authMiddleware'), // requireAuth, optionalAuth, requireInternalKey
    ...require('./rateLimit'), // globalLimiter, aiLimiter, authLimiter, makeLimiter
    ...require('./createApp'), // createApp
    ...require('./startServer'), // startServer
    jwt: require('./jwt'),

    // domain
    bio: {
        uniprot: require('./bio/uniprot'),
        chembl: require('./bio/chembl'),
        stringdb: require('./bio/stringdb'),
        structure: require('./bio/structure'),
        ...require('./bio/dossier'), // getProteinDossier, cacheStats
    },
    ai: require('./ai/chat'),
    data: {
        users: require('./data/users'),
        refreshTokens: require('./data/refreshTokens'),
        workspace: require('./data/workspace'),
    },
    auth: {
        google: require('./auth/google'),
        email: require('./auth/email'),
    },
};
