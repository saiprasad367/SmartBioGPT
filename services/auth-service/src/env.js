const { z } = require('@sbg/shared');

/** Validated once at boot so the process fails fast with a readable error. */
const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    // Optional integrations - the service degrades gracefully without them.
    GOOGLE_CLIENT_ID: z.string().optional(),
    REDIS_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    // eslint-disable-next-line no-console
    console.error(`\n[auth-service] invalid environment:\n${issues}\n`);
    process.exit(1);
}

module.exports = parsed.data;
