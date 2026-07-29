const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
const config = require('../config/config');
const { logger } = require('./logger');

class DriverFactory {
  static async createDriver() {
    const browser = config.browserName.toLowerCase();
    const isHeadless = config.headless;
    
    logger.info(`Initializing WebDriver: Browser=[${browser}], Headless=[${isHeadless}]`);
    
    let builder = new Builder();
    
    switch (browser) {
      case 'chrome':
        const chromeOptions = new chrome.Options();
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');
        chromeOptions.addArguments('--disable-gpu');
        chromeOptions.addArguments('--window-size=1920,1080');
        if (isHeadless) {
          chromeOptions.addArguments('--headless=new');
        }
        builder = builder.forBrowser('chrome').setChromeOptions(chromeOptions);
        break;
        
      case 'firefox':
        const firefoxOptions = new firefox.Options();
        firefoxOptions.addArguments('--window-size=1920,1080');
        if (isHeadless) {
          firefoxOptions.addArguments('--headless');
        }
        builder = builder.forBrowser('firefox').setFirefoxOptions(firefoxOptions);
        break;
        
      case 'edge':
        const edgeOptions = new edge.Options();
        edgeOptions.addArguments('--no-sandbox');
        edgeOptions.addArguments('--disable-dev-shm-usage');
        edgeOptions.addArguments('--window-size=1920,1080');
        if (isHeadless) {
          edgeOptions.addArguments('--headless');
        }
        builder = builder.forBrowser('MicrosoftEdge').setEdgeOptions(edgeOptions);
        break;
        
      default:
        throw new Error(`Unsupported browser: ${browser}`);
    }
    
    const driver = await builder.build();
    await driver.manage().setTimeouts({ implicit: config.implicitWaitTimeout });
    await driver.manage().window().maximize();
    
    logger.info('WebDriver initialized successfully.');
    return driver;
  }
}

module.exports = DriverFactory;
