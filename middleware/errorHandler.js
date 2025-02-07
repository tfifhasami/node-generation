const { logger } = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(`Unexpected error: ${err.stack}`);
    res.status(500).send('Something broke!');
};

module.exports = errorHandler;
