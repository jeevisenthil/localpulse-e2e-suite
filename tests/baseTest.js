const DriverFactory = require('../utilities/driverFactory');
const BasePage = require('../pages/basePage');
const { logger, logStep } = require('../utilities/logger');
const config = require('../config/config');

let driver = null;
let basePage = null;

// Registry of test results for the Excel reporter
const testResults = [];

const setupHooks = {
  async beforeAll() {
    logger.info('=== Setting up test suite execution environment ===');
    driver = await DriverFactory.createDriver();
    basePage = new BasePage(driver);
    return { driver, basePage };
  },

  async afterAll() {
    logger.info('=== Tearing down test suite execution environment ===');
    if (driver) {
      await driver.quit();
      logger.info('WebDriver instance terminated.');
    }
  },

  async beforeEach(testContext) {
    testContext.startTime = new Date();
    logger.info(`Starting test: [${testContext.currentTest.title}]`);
  },

  async afterEach(testContext) {
    const endTime = new Date();
    const duration = `${((endTime - testContext.startTime) / 1000).toFixed(2)}s`;
    const title = testContext.currentTest.title;
    const status = testContext.currentTest.state || 'skipped';
    
    let errorMsg = '';
    let screenshotPath = '';
    let currentUrl = '';

    if (status === 'failed') {
      errorMsg = testContext.currentTest.err ? testContext.currentTest.err.message : 'Unknown error';
      logger.error(`Test FAILED: [${title}] - Error: ${errorMsg}`);
      
      if (driver) {
        try {
          currentUrl = await driver.getCurrentUrl();
          screenshotPath = await basePage.takeScreenshot(title);
          
          // Try to capture console errors
          try {
            const browserLogs = await driver.manage().logs().get('browser');
            if (browserLogs && browserLogs.length > 0) {
              logger.error('=== Browser Console Logs ===');
              browserLogs.forEach(log => {
                logger.error(`[${log.level.name}] ${log.message}`);
              });
            }
          } catch (logErr) {
            // Logs are not supported by some drivers (e.g. Firefox)
          }
        } catch (err) {
          logger.error('Failed to capture failure info:', err);
        }
      }
      
      logStep(title, 'Test finished with FAILURE', 'FAIL', errorMsg);
    } else {
      logger.info(`Test PASSED: [${title}] (Duration: ${duration})`);
      logStep(title, 'Test finished successfully', 'PASS');
    }

    testResults.push({
      title,
      status,
      start: testContext.startTime.toISOString().replace('T', ' ').substring(0, 19),
      end: endTime.toISOString().replace('T', ' ').substring(0, 19),
      duration,
      error: errorMsg,
      screenshotPath,
      url: currentUrl,
      module: testContext.currentTest.parent.title || 'Core'
    });
  }
};

function getTestResults() {
  return testResults;
}

module.exports = {
  setupHooks,
  getTestResults,
  getDriver: () => driver,
  getBasePage: () => basePage
};
