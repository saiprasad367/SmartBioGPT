const supabase = require('../config/supabase');
const aiService = require('../services/aiService');
const { z } = require('zod');

// @desc    Start/Continue chat
// @route   POST /chat/message
const sendMessage = async (req, res) => {
    const messageSchema = z.object({
        sessionId: z.string().optional(),
        message: z.string().min(1),
        proteinContext: z.string().optional(),
        contextData: z.any().optional(),
    });

    try {
        const { sessionId, message, proteinContext, contextData } = messageSchema.parse(req.body);

        // GUEST MODE: Skip DB Insert
        // Check if user is guest (contains 'guest' or is the specific ID)
        if (req.user.id.includes('guest')) {
            const currentSessionId = sessionId || 'guest_session_' + Date.now();

            // Simple AI call without history persistence
            const history = [{ role: 'user', content: message }];
            const aiResponseContent = await aiService.generateChatResponse(history, contextData);

            return res.json({
                sessionId: currentSessionId,
                messages: [
                    { role: 'user', content: message },
                    { role: 'assistant', content: aiResponseContent }
                ],
                warning: 'Guest Mode: History not saved'
            });
        }

        let currentSessionId = sessionId;

        // 1. Create Session if needed
        if (!currentSessionId) {
            const { data: newSession, error: sessionError } = await supabase
                .from('chat_sessions')
                .insert({
                    user_id: req.user.id,
                    title: proteinContext ? `Research: ${proteinContext}` : 'New Conversation',
                    protein_context: proteinContext,
                })
                .select()
                .single();

            if (sessionError) throw sessionError;
            currentSessionId = newSession.id;
        }

        // 2. Insert User Message
        const { error: msgError } = await supabase.from('messages').insert({
            session_id: currentSessionId,
            role: 'user',
            content: message,
        });
        if (msgError) throw msgError;

        // 3. Get History for AI context (Limit to last 10 for efficiency)
        const { data: history } = await supabase
            .from('messages')
            .select('role, content')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: true });

        // 4. Generate AI Response
        const aiResponseContent = await aiService.generateChatResponse(history || [{ role: 'user', content: message }], contextData);

        // 5. Insert AI Message
        const { data: aiMsg, error: aiError } = await supabase.from('messages').insert({
            session_id: currentSessionId,
            role: 'assistant',
            content: aiResponseContent,
        }).select().single();
        if (aiError) throw aiError;

        // 6. Return standard format
        // Fetch full updated messages to sync
        const { data: allMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: true });

        res.json({
            sessionId: currentSessionId,
            messages: allMessages,
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: error.errors[0].message });
        } else {
            console.error("Chat Error:", error);
            res.status(500).json({ message: error.message });
        }
    }
};

// @desc    Get History
// @route   GET /chat/history
const getHistory = async (req, res) => {
    const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
};

// @desc    Get Session
// @route   GET /chat/session/:id
const getSession = async (req, res) => {
    const { data: session, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (error || !session) return res.status(404).json({ message: 'Session not found' });

    // Get messages
    const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

    res.json({ ...session, messages });
};

module.exports = {
    sendMessage,
    getHistory,
    getSession,
};
