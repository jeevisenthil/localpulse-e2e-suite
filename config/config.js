module.exports = {
  // Target Application URL (Express server hosting the LocalPulse portal)
  appUrl: process.env.TEST_APP_URL || 'http://localhost:3005',
  
  // Browser settings: 'chrome' | 'firefox' | 'edge'
  browserName: process.env.TEST_BROWSER || 'chrome',
  
  // Execution settings: true | false (CI/CD environments use headless mode)
  headless: process.env.TEST_HEADLESS === 'true' || true,
  
  // Wait settings (in milliseconds)
  implicitWaitTimeout: 5000,
  explicitWaitTimeout: 10000,
  
  // Retry failed tests count
  retryAttempts: 1,

  // Test data paths
  dbPath: './sandbox_db.json'
};
