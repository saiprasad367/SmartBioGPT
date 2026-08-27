const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

/**
 * Environment schema. Validated once at boot so the process fails fast
 * with a readable error instead of throwing deep inside a request.
 */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),

    // Comma separated list of allowed browser origins for CORS.
    CORS_ORIGINS: z.string().default('http://localhost:8080,http://localhost:5173,http://localhost:3000'),

    // Supabase - required for auth + persistence.
    SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
    SUPABASE_ANON_KEY: z.string().min(20, 'SUPABASE_ANON_KEY is required'),
    // Service role key: used only server-side for privileged DB writes. Optional in dev.
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

    // AI provider (OpenRouter). Optional - the service degrades to a deterministic fallback.
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_MODEL: z.string().default('google/gemini-2.0-flash-001'),
    OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
    APP_PUBLIC_URL: z.string().url().default('http://localhost:8080'),

    // Mail (nodemailer / SMTP). Optional - welcome mail becomes a no-op when unset.
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_SECURE: z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().default('Smart Bio GPT <no-reply@smartbiogpt.ai>'),

    // Resilience tuning for outbound calls to external bio databases.
    HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),
    HTTP_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
    BIO_CACHE_TTL_MS: z.coerce.number().int().positive().default(1000 * 60 * 60 * 6), // 6h
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const issues = parsed.error.issues
        .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
    // eslint-disable-next-line no-console
    console.error(`\n❌ Invalid environment configuration:\n${issues}\n`);
    process.exit(1);
}

const env = parsed.data;

env.CORS_ORIGIN_LIST = env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

env.isProd = env.NODE_ENV === 'production';
env.isDev = env.NODE_ENV === 'development';
env.mailEnabled = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
env.aiEnabled = Boolean(env.OPENROUTER_API_KEY);

module.exports = env;
