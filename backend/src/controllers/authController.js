const supabase = require('../config/supabase');
const { z } = require('zod');

// @desc    Register a new user
// @route   POST /auth/register
const registerUser = async (req, res) => {
    const registerSchema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
    });

    try {
        const { name, email, password } = registerSchema.parse(req.body);

        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }, // Metadata for profile trigger
            },
        });

        if (error) throw error;

        // Check if user already exists (Supabase might return specific error or empty user)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        res.status(201).json({
            _id: data.user.id,
            name: name,
            email: data.user.email,
            role: 'user',
            token: data.session?.access_token,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors[0].message });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
};

// @desc    Auth user & get token
// @route   POST /auth/login
const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        res.json({
            _id: data.user.id,
            name: data.user.user_metadata?.name || 'User',
            email: data.user.email,
            role: 'user',
            token: data.session.access_token,
        });
    } catch (error) {
        res.status(401).json({ message: error.message || 'Invalid credentials' });
    }
};

// @desc    Get user profile
// @route   GET /auth/verify
const getUserProfile = async (req, res) => {
    // User is already attached by middleware
    res.json({
        _id: req.user.id,
        name: req.user.user_metadata?.name || 'User',
        email: req.user.email,
        role: 'user',
    });
};

module.exports = {
    registerUser,
    authUser,
    getUserProfile,
};
