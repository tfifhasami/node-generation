const express = require('express');
const path = require('path');
const cors = require('cors');
const { logger } = require('./config/logger');
const uploadRoutes = require('./routes/uploadRoutes');
const processRoutes = require('./routes/processRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes')
const { wsManager, setupWebSocket } = require('./service/websocketManager');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/database');

const app = express();
const PORT = 3008;

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));
app.use('/templates',express.static(path.join(__dirname, 'templates')))

// Routes
app.use('/upload', uploadRoutes);
app.use('/process', processRoutes);
app.use('/download', downloadRoutes);
app.use('/auth', authRoutes);
app.use('/automation',requestRoutes);
// Error Handling Middleware
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});

// Setup WebSocket
setupWebSocket(server);
