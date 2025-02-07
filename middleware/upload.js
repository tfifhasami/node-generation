const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { logger } = require('../config/logger');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '../uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        logger.info(`Saving file to directory: ${uploadsDir}`);
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const newFilename = `${uniqueSuffix}${path.extname(file.originalname)}`;
        logger.info(`Generated filename: ${newFilename}`);
        cb(null, newFilename);
    }
});

const upload = multer({ storage });

module.exports = upload;
