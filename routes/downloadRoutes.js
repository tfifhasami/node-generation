const express = require('express');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

const router = express.Router();

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

// Download Endpoint
router.get('/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../outputs', fileName);

    if (!fs.existsSync(filePath)) {
        logger.error(`File not found: ${filePath}`);
        return res.status(404).send('File not found.');
    }

    logger.info(`Serving file: ${filePath}`);
    res.download(filePath, fileName);
});

// Download Endpoint for Excel template
router.get('/templates/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../templates', fileName);

    if (!fs.existsSync(filePath)) {
        logger.error(`Template file not found: ${filePath}`);
        return res.status(404).send('Template file not found.');
    }

    logger.info(`Serving template file: ${filePath}`);
    res.download(filePath, fileName);
});



module.exports = router;
