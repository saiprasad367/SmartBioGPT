const { z } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Validate and REPLACE req[part] with the parsed (typed, stripped) value.
 * Usage: router.post('/x', validate({ body: schema }), handler)
 */
function validate(schemas) {
    return (req, _res, next) => {
        try {
            for (const part of ['body', 'query', 'params']) {
                if (schemas[part]) req[part] = schemas[part].parse(req[part]);
            }
            next();
        } catch (err) {
            if (err instanceof z.ZodError) {
                return next(
                    ApiError.badRequest('Validation failed', {
                        code: 'VALIDATION_ERROR',
                        details: err.issues.map((i) => ({
                            path: i.path.join('.'),
                            message: i.message,
                        })),
                    })
                );
            }
            next(err);
        }
    };
}

module.exports = { validate, z };
