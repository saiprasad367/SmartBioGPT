const supabase = require('../config/supabase');

// @desc    Get user favorites
// @route   GET /user/favorites
const getFavorites = async (req, res) => {
    const { data, error } = await supabase
        .from('favorites')
        .select('protein_id')
        .eq('user_id', req.user.id);

    if (error) throw new Error(error.message);

    // Return array of strings to match frontend expectation
    res.json(data.map(f => f.protein_id));
};

// @desc    Add a favorite
// @route   POST /user/favorites
const addFavorite = async (req, res) => {
    const { proteinId } = req.body;
    if (!proteinId) throw new Error('Protein ID required');

    // Check if exists
    const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('protein_id', proteinId)
        .single();

    if (existing) {
        return res.status(400).json({ message: 'Already in favorites' });
    }

    const { error } = await supabase
        .from('favorites')
        .insert({ user_id: req.user.id, protein_id: proteinId });

    if (error) throw new Error(error.message);

    // Return updated list
    const { data: all } = await supabase.from('favorites').select('protein_id').eq('user_id', req.user.id);
    res.json(all.map(f => f.protein_id));
};

// @desc    Remove a favorite
// @route   DELETE /user/favorites/:proteinId
const removeFavorite = async (req, res) => {
    const { proteinId } = req.params;

    const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', req.user.id)
        .eq('protein_id', proteinId);

    if (error) throw new Error(error.message);

    const { data: all } = await supabase.from('favorites').select('protein_id').eq('user_id', req.user.id);
    res.json(all.map(f => f.protein_id));
};

const { sendWelcomeEmail } = require('../services/emailService');

// @desc    Send welcome email
// @route   POST /user/welcome
const sendWelcome = async (req, res) => {
    const { email, name } = req.body;

    if (!email || !name) {
        return res.status(400).json({ message: 'Email and Name are required' });
    }

    const result = await sendWelcomeEmail(email, name);

    if (result.success) {
        res.json({ message: 'Email sent successfully' });
    } else {
        res.status(500).json({ message: 'Failed to send email' });
    }
};

module.exports = {
    getFavorites,
    addFavorite,
    removeFavorite,
    sendWelcome
};
