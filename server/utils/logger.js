const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log directory
const logDir = path.join(__dirname, '..', 'logs');
const fs = require('fs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define custom format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),
        // Rotate Daily for General Logs
        new DailyRotateFile({
            filename: path.join(logDir, 'server-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d', // Keep 14 days
            level: 'info'
        }),
        // Rotate Daily for Errors
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d', // Keep 30 days
            level: 'error'
        }),
        // Rotate Daily for ADMS Requests (High Volume)
        new DailyRotateFile({
            filename: path.join(logDir, 'adms-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '50m',
            maxFiles: '7d', // Keep 7 days
            level: 'http'
        })
    ]
});

// Create a specific logger for ADMS to separate them if needed, 
// strictly creating a stream we can use in middleware or just using 'http' level
logger.adms = (message) => {
    logger.log('http', message);
};

module.exports = logger;
