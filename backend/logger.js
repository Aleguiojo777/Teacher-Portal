const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}] ${message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new transports.File({ filename: 'backend/logs/error.log', level: 'error' }),
    new transports.File({ filename: 'backend/logs/combined.log' })
  ]
});

// Console logging during development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({ format: combine(colorize(), timestamp(), myFormat) }));
}

module.exports = logger;
