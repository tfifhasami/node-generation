const express = require('express');
const upload = require('../middleware/upload');
const { logger } = require('../config/logger');
const crypto = require('crypto');

const router = express.Router();

router.post('/', upload.single('excelFile'), (req, res) => {
    if (!req.file) {
        logger.warn('No file uploaded');
        return res.status(400).send('No file uploaded.');
    }

    const socketId = crypto.randomBytes(16).toString('hex');
    logger.info(`Upload successful: ${req.file.filename}, Socket ID: ${socketId}`);

    res.json({
        message: 'File uploaded successfully',
        fileName: req.file.filename,
        filePath: req.file.path,
        socketId: socketId
    });
});

module.exports = router;
