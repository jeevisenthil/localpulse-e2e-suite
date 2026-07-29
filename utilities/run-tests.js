const Mocha = require('mocha');
const path = require('path');
const { generateExcelReport } = require('./excelReportGenerator');
const { getTestResults } = require('../tests/baseTest');
const { logger } = require('./logger');

// Configure Mocha runner
const mocha = new Mocha({
  timeout: 60000,
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'reports',
    reportFilename: 'index',
    html: true,
    json: true,
    overwrite: true,
    quiet: true
  }
});

// Load E2E spec files
mocha.addFile(path.join(__dirname, '../tests/e2e.spec.js'));

logger.info('===============================================');
logger.info('   Starting LocalPulse E2E Selenium Suite      ');
logger.info('===============================================');

const startTime = Date.now();

mocha.run(async (failures) => {
  const durationMs = Date.now() - startTime;
  const duration = `${(durationMs / 1000).toFixed(2)}s`;
  
  const testResults = getTestResults();
  
  const results = {
    total: testResults.length,
    passed: testResults.filter(t => t.status === 'passed').length,
    failed: testResults.filter(t => t.status === 'failed').length,
    skipped: testResults.filter(t => t.status === 'skipped').length,
    duration,
    tests: testResults
  };

  logger.info('=== Testing completed. Compiling final metrics ===');
  
  try {
    await generateExcelReport(results);
    logger.info('Excel E2E log outputs written to excel/E2E_Report.xlsx');
  } catch (reportError) {
    logger.error('Failed to export Excel report logs:', reportError);
  }

  logger.info(`Final Results: Total=${results.total} | Passed=${results.passed} | Failed=${results.failed}`);
  logger.info('===============================================');
  
  // Terminate with code matching test outcome
  process.exit(failures ? 1 : 0);
});
