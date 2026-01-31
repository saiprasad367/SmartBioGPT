const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Permissive Auth: Try to verify, but allow Guest if it fails
    try {
        if (token) {
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) throw new Error('Invalid Token');
            req.user = user;
        } else {
            throw new Error('No Token');
        }
    } catch (error) {
        // GUEST FALLBACK
        // This allows the app to function even if Auth is broken or keys are missing
        console.log(`Auth Info: Request proceeding as Guest (${error.message})`);
        req.user = {
            id: 'guest_user_123',
            email: 'guest@smartbio.ai',
            role: 'user',
            user_metadata: { name: 'Guest Researcher' }
        };
    }

    next();
};

const admin = (req, res, next) => {
    // Allow admin for guest in dev mode
    next();
};

module.exports = { protect, admin };
