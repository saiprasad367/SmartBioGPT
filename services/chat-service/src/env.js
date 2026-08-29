const { z } = require('@sbg/shared');

const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4003),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    INTERNAL_API_KEY: z.string().min(8, 'INTERNAL_API_KEY is required'),
    BIO_SERVICE_URL: z.string().url().default('http://bio-service:4002'),
    REDIS_URL: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    // eslint-disable-next-line no-console
    console.error(`\n[chat-service] invalid environment:\n${issues}\n`);
    process.exit(1);
}

module.exports = parsed.data;
