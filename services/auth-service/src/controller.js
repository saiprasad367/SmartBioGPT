const bcrypt = require('bcryptjs');
const {
    asyncHandler,
    validate,
    z,
    ApiError,
    logger,
    jwt,
    data,
    auth,
} = require('@sbg/shared');
const { issueSession, rotateSession } = require('./tokens');

const BCRYPT_ROUNDS = 12;

const registerSchema = {
    body: z.object({
        name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
        email: z.string().trim().email().toLowerCase(),
        password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    }),
};

const loginSchema = {
    body: z.object({
        email: z.string().trim().email().toLowerCase(),
        password: z.string().min(1),
    }),
};

const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await data.users.findByEmail(email);
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await data.users.createWithPassword({ name, email, passwordHash });

    auth.email
        .sendWelcomeEmail(email, name)
        .catch((err) => logger.warn({ err: err.message }, 'welcome email failed (non-fatal)'));

    const session = await issueSession(user);
    res.status(201).json({ ...session, emailConfirmationRequired: false });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const row = await data.users.findByEmail(email);
    if (!row || !row.password_hash) throw ApiError.unauthorized('Invalid email or password');

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) throw ApiError.unauthorized('Invalid email or password');

    res.json(await issueSession(data.users.toUser(row)));
});

const google = asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const profile = await auth.google.verifyIdToken(idToken);

    const isNew = !(await data.users.findByEmail(profile.email));
    const user = await data.users.upsertGoogleUser(profile);

    if (isNew) {
        auth.email
            .sendWelcomeEmail(user.email, user.name)
            .catch((err) => logger.warn({ err: err.message }, 'welcome email failed (non-fatal)'));
    }

    res.status(isNew ? 201 : 200).json({ ...(await issueSession(user)), emailConfirmationRequired: false });
});

const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const record = await data.refreshTokens.findValid(jwt.hashRefreshToken(refreshToken));
    if (!record) throw ApiError.unauthorized('Could not refresh session');

    const user = await data.users.findById(record.user_id);
    if (!user) throw ApiError.unauthorized('Could not refresh session');

    res.json(await rotateSession(refreshToken, user));
});

const me = asyncHandler(async (req, res) => {
    const user = (await data.users.findById(req.user.id)) || req.user;
    res.json({ user });
});

const logout = asyncHandler(async (req, res) => {
    if (req.body?.refreshToken) {
        await data.refreshTokens.revoke(jwt.hashRefreshToken(req.body.refreshToken));
    }
    res.json({ ok: true });
});

module.exports = {
    register: [validate(registerSchema), register],
    login: [validate(loginSchema), login],
    google: [validate({ body: z.object({ idToken: z.string().min(10) }) }), google],
    refresh: [validate({ body: z.object({ refreshToken: z.string().min(10) }) }), refresh],
    me,
    logout,
};
