const WebSocket = require('ws');
const { logger } = require('../config/logger');

class WebSocketManager {
    constructor() {
        this.connections = new Map();
    }

    addConnection(socketId, ws) {
        this.connections.set(socketId, ws);
        logger.info(`WebSocket connection added for ID: ${socketId}`);
    }

    removeConnection(socketId) {
        this.connections.delete(socketId);
        logger.info(`WebSocket connection removed for ID: ${socketId}`);
    }
}

const wsManager = new WebSocketManager();

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws, req) => {
        const socketId = req.url.split('/').pop();

        if (!socketId) {
            logger.warn('Invalid socket connection: No socket ID');
            ws.close();
            return;
        }

        wsManager.addConnection(socketId, ws);

        ws.on('close', () => {
            wsManager.removeConnection(socketId);
        });

        ws.send(JSON.stringify({ message: 'WebSocket connection established', socketId }));
    });

    server.on('upgrade', (request, socket, head) => {
        if (request.url.startsWith('/progress')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });
}

module.exports = { wsManager, setupWebSocket };
