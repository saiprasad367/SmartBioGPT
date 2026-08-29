const { z } = require('@sbg/shared');

const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4002),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    // Internal call target for recording signed-in users' search history.
    CHAT_SERVICE_URL: z.string().url().default('http://chat-service:4003'),
    INTERNAL_API_KEY: z.string().min(8, 'INTERNAL_API_KEY is required'),
    REDIS_URL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    // eslint-disable-next-line no-console
    console.error(`\n[bio-service] invalid environment:\n${issues}\n`);
    process.exit(1);
}

module.exports = parsed.data;
