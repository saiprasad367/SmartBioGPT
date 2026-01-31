const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// Crash handling - Must be at the top
process.on('uncaughtException', (err) => {
    console.error('CRITICAL ERROR (Uncaught Exception):', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL ERROR (Unhandled Rejection):', reason);
});

try {
    // Load env vars
    dotenv.config();
    console.log("Environment loaded.");

    const app = express();

    // Middleware
    app.use(express.json());
    app.use(cors());
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    }

    // Routes imports
    console.log("Loading routes...");
    const authRoutes = require('./routes/authRoutes');
    const bioRoutes = require('./routes/bioRoutes');
    const chatRoutes = require('./routes/chatRoutes');
    const userRoutes = require('./routes/userRoutes');
    const structureRoutes = require('./routes/structureRoutes');

    // Mount routes
    app.use('/auth', authRoutes);
    app.use('/bio', bioRoutes);
    app.use('/chat', chatRoutes);
    app.use('/user', userRoutes);
    app.use('/structure', structureRoutes);

    app.get('/', (req, res) => {
        res.send('Smart Bio GPT (Supabase Edition) is active.');
    });

    // Error Handler Middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode).json({
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        });
    });

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
        console.log(`\n✅ SERVER STARTED SUCCESSFULLY on Port ${PORT}`);
        console.log(`   Mode: ${process.env.NODE_ENV}`);
        console.log(`   Supabase Endpoint: ${process.env.SUPABASE_URL ? 'Configured' : 'MISSING'}\n`);
    });

    // Explicit keep-alive (usually not needed if listen works, but good for debugging)
    server.on('error', (e) => console.error("Server Error:", e));

} catch (error) {
    console.error("Failed to start server:", error);
}
