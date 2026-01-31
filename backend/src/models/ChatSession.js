const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['user', 'assistant', 'system'],
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const chatSessionSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            default: 'New Chat',
        },
        proteinContext: {
            type: String, // e.g., "TP53"
        },
        messages: [messageSchema],
    },
    {
        timestamps: true,
    }
);

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;
