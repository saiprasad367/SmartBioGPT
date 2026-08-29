const { asyncHandler, validate, z, ApiError, data, ai } = require('@sbg/shared');
const { getDossier } = require('./bioClient');

const repo = data.workspace;
const HISTORY_WINDOW = 12;

// ---- chat ----------------------------------------------------------------

const messageSchema = {
    body: z.object({
        chatId: z.string().uuid().optional(),
        message: z.string().trim().min(1).max(8000),
        proteinAccession: z.string().trim().min(2).max(120).optional(),
    }),
};

const sendMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    let { chatId, message, proteinAccession } = req.body;

    let contextData = null;
    if (proteinAccession) contextData = await getDossier(proteinAccession);

    if (!chatId) {
        const chat = await repo.createChat(userId, {
            title: message.slice(0, 60),
            proteinAccession: contextData?.accession || proteinAccession || null,
        });
        chatId = chat.id;
    } else {
        await repo.getChat(userId, chatId); // ownership check
    }

    await repo.addMessage(chatId, { role: 'user', content: message });

    const history = await repo.listMessages(chatId);
    const window = history.slice(-HISTORY_WINDOW).map((m) => ({ role: m.role, content: m.content }));

    const answer = await ai.generateChatResponse(window, contextData);

    const assistant = await repo.addMessage(chatId, {
        role: 'assistant',
        content: answer.content,
        degraded: answer.degraded,
    });

    if (history.length <= 1) {
        await repo.updateChat(userId, chatId, { title: message.slice(0, 60) }).catch(() => {});
    }

    res.json({
        chatId,
        message: assistant,
        degraded: answer.degraded,
        context: contextData ? { accession: contextData.accession, name: contextData.name } : null,
    });
});

const listChats = asyncHandler(async (req, res) => {
    res.json({ data: await repo.listChats(req.user.id) });
});

const getChat = asyncHandler(async (req, res) => {
    res.json({ data: await repo.getChat(req.user.id, req.params.id) });
});

const renameChat = asyncHandler(async (req, res) => {
    res.json({ data: await repo.updateChat(req.user.id, req.params.id, { title: req.body.title }) });
});

const deleteChat = asyncHandler(async (req, res) => {
    await repo.deleteChat(req.user.id, req.params.id);
    res.status(204).send();
});

// ---- user workspace ----------------------------------------------------

const getFavorites = asyncHandler(async (req, res) => {
    res.json({ data: await repo.listFavorites(req.user.id) });
});

const addFavorite = asyncHandler(async (req, res) => {
    res.status(201).json({ data: await repo.addFavorite(req.user.id, req.body) });
});

const removeFavorite = asyncHandler(async (req, res) => {
    await repo.removeFavorite(req.user.id, req.params.accession);
    res.status(204).send();
});

const getHistory = asyncHandler(async (req, res) => {
    res.json({ data: await repo.listSearchHistory(req.user.id) });
});

// ---- internal (service-to-service) -----------------------------------

const recordSearchHistory = asyncHandler(async (req, res) => {
    const { userId, query, accession } = req.body;
    if (!userId || !query) throw ApiError.badRequest('userId and query are required');
    await repo.recordSearch(userId, { query, accession });
    res.status(202).json({ ok: true });
});

const idParam = { params: z.object({ id: z.string().uuid() }) };

module.exports = {
    sendMessage: [validate(messageSchema), sendMessage],
    listChats,
    getChat: [validate(idParam), getChat],
    renameChat: [
        validate({ ...idParam, body: z.object({ title: z.string().trim().min(1).max(120) }) }),
        renameChat,
    ],
    deleteChat: [validate(idParam), deleteChat],
    getFavorites,
    addFavorite: [
        validate({
            body: z.object({
                accession: z.string().trim().min(2).max(120),
                name: z.string().trim().max(200).optional(),
                gene: z.string().trim().max(60).optional(),
                organism: z.string().trim().max(120).optional(),
            }),
        }),
        addFavorite,
    ],
    removeFavorite: [
        validate({ params: z.object({ accession: z.string().trim().min(2).max(120) }) }),
        removeFavorite,
    ],
    getHistory,
    recordSearchHistory: [
        validate({
            body: z.object({
                userId: z.string().uuid(),
                query: z.string().trim().min(1).max(200),
                accession: z.string().trim().max(120).nullable().optional(),
            }),
        }),
        recordSearchHistory,
    ],
};
