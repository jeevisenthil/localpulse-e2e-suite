const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [${level}]: ${message}`;
        })
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      level: 'info'
    })
  ]
});

// Helper for test reports log sheets
const executionSteps = [];

function logStep(testName, stepDescription, result = 'PASS', remarks = '') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  logger.info(`[${testName}] Step: ${stepDescription} - ${result} ${remarks ? `(${remarks})` : ''}`);
  executionSteps.push({
    timestamp,
    testName,
    stepDescription,
    result,
    remarks
  });
}

function getExecutionSteps() {
  return executionSteps;
}

function clearExecutionSteps() {
  executionSteps.length = 0;
}

module.exports = {
  logger,
  logStep,
  getExecutionSteps,
  clearExecutionSteps
};
