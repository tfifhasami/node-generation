const User = require('../models/userModel');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const winston = require('winston');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
const PYTHON_PATH = path.join(__dirname, '../automate_env/bin/python3');

// Logger Configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => 
            `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server.log' })
    ]
});

// Process File Endpoint
router.post('/', authenticate, async (req, res) => {
    const { fileName, socketId } = req.body;
    const userId = req.user.id; // Get user ID from the authenticated user

    if (!fileName || !socketId || !userId) {
        logger.warn('Missing file name, socket ID, or user ID');
        return res.status(400).json({ error: 'Missing file name, socket ID, or user ID' });
    }

    const filePath = path.join(__dirname, '../uploads', fileName);

    if (!fs.existsSync(filePath)) {
        logger.error(`File not found: ${filePath}`);
        return res.status(404).json({ error: 'File not found' });
    }

    logger.info(`Processing file: ${filePath} with Socket ID: ${socketId}`);

    const command = `"${PYTHON_PATH}" auto.py "${filePath}" "${socketId}"`;
    logger.info(`Executing command: ${command}`);

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            logger.error(`Execution error: ${error.message}`);
            return res.status(500).json({ error: 'Error processing file' });
        }

        if (stderr) logger.warn(`stderr: ${stderr}`);
        logger.info(`stdout: ${stdout}`);

        const outputPathMatch = stdout.match(/Output file: (.+)/);
        const outputPath = outputPathMatch ? outputPathMatch[1].trim() : null;

        if (!outputPath || !fs.existsSync(outputPath)) {
            logger.error('Output path not found or invalid.');
            return res.status(500).json({ error: 'Processing error: output not found' });
        }

        const isZipFile = outputPath.endsWith('.zip');

        // Update the user's process history
        await User.findByIdAndUpdate(userId, {
            $push: {
                processHistory: {
                    date: new Date(),
                    count: 1
                }
            }
        });

        res.json({
            message: 'File processed successfully',
            outputPath: outputPath,
            isZip: isZipFile
        });
    });
});

module.exports = router;
