const { supabaseAuth } = require('../config/supabase');
const { validate, z } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { sendWelcomeEmail } = require('../services/emailService');

const registerSchema = {
    body: z.object({
        name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
        email: z.string().trim().email(),
        password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    }),
};

const loginSchema = {
    body: z.object({
        email: z.string().trim().email(),
        password: z.string().min(1),
    }),
};

function toSession(data, name) {
    return {
        user: {
            id: data.user.id,
            email: data.user.email,
            name: name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
        },
        token: data.session?.access_token || null,
        refreshToken: data.session?.refresh_token || null,
        expiresAt: data.session?.expires_at || null,
    };
}

const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
        options: { data: { name } },
    });
    if (error) throw ApiError.badRequest(error.message, { code: 'SIGNUP_FAILED' });

    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw ApiError.conflict('An account with this email already exists');
    }

    sendWelcomeEmail(email, name).catch((err) =>
        logger.warn({ err: err.message }, 'welcome email failed (non-fatal)')
    );

    res.status(201).json({
        ...toSession(data, name),
        emailConfirmationRequired: !data.session,
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) {
        if (/email not confirmed/i.test(error.message)) {
            throw ApiError.forbidden('Please confirm your email address before signing in', {
                code: 'EMAIL_NOT_CONFIRMED',
            });
        }
        throw ApiError.unauthorized('Invalid email or password');
    }
    res.json(toSession(data));
});

const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session) throw ApiError.unauthorized('Could not refresh session');
    res.json(toSession(data));
});

const me = asyncHandler(async (req, res) => {
    res.json({ user: req.user });
});

const logout = asyncHandler(async (req, res) => {
    if (req.accessToken) {
        await supabaseAuth.auth.admin?.signOut?.(req.accessToken).catch(() => {});
    }
    res.json({ ok: true });
});

module.exports = {
    register: [validate(registerSchema), register],
    login: [validate(loginSchema), login],
    refresh: [validate({ body: z.object({ refreshToken: z.string().min(10) }) }), refresh],
    me,
    logout,
};
