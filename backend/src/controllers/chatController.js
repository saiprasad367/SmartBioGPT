const { validate, z } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const repository = require('../services/repository');
const bioService = require('../services/bioService');
const aiService = require('../services/aiService');

const messageSchema = {
    body: z.object({
        chatId: z.string().uuid().optional(),
        message: z.string().trim().min(1).max(8000),
        proteinAccession: z.string().trim().min(2).max(120).optional(),
    }),
};

const HISTORY_WINDOW = 12;

const sendMessage = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    let { chatId, message, proteinAccession } = req.body;

    // Resolve protein context server-side (never trust a client-supplied dossier).
    let contextData = null;
    if (proteinAccession) {
        try {
            contextData = await bioService.getProteinDossier(proteinAccession);
        } catch (err) {
            logger.debug({ err: err.message, proteinAccession }, 'context dossier unavailable');
        }
    }

    // Create the chat lazily on first message.
    if (!chatId) {
        const chat = await repository.createChat(userId, {
            title: message.slice(0, 60),
            proteinAccession: contextData?.accession || proteinAccession || null,
        });
        chatId = chat.id;
    } else {
        // ownership check
        await repository.getChat(userId, chatId);
    }

    await repository.addMessage(chatId, { role: 'user', content: message });

    const history = await repository.listMessages(chatId);
    const window = history.slice(-HISTORY_WINDOW).map((m) => ({ role: m.role, content: m.content }));

    const ai = await aiService.generateChatResponse(window, contextData);

    const assistant = await repository.addMessage(chatId, {
        role: 'assistant',
        content: ai.content,
        degraded: ai.degraded,
    });

    // Auto-title from the first exchange.
    if (history.length <= 1) {
        await repository
            .updateChat(userId, chatId, { title: message.slice(0, 60) })
            .catch(() => {});
    }

    res.json({
        chatId,
        message: assistant,
        degraded: ai.degraded,
        context: contextData ? { accession: contextData.accession, name: contextData.name } : null,
    });
});

const listChats = asyncHandler(async (req, res) => {
    res.json({ data: await repository.listChats(req.user.id) });
});

const getChat = asyncHandler(async (req, res) => {
    res.json({ data: await repository.getChat(req.user.id, req.params.id) });
});

const renameChat = asyncHandler(async (req, res) => {
    const updated = await repository.updateChat(req.user.id, req.params.id, { title: req.body.title });
    res.json({ data: updated });
});

const deleteChat = asyncHandler(async (req, res) => {
    await repository.deleteChat(req.user.id, req.params.id);
    res.status(204).send();
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
};
