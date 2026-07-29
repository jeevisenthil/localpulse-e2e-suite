const { By, until } = require('selenium-webdriver');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { logger } = require('../utilities/logger');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = config.explicitWaitTimeout;
  }

  // Navigation
  async navigateTo(url) {
    logger.info(`Navigating to URL: ${url}`);
    await this.driver.get(url);
  }

  // Explicit Wait Helpers
  async waitForElementLocated(locator, customTimeout = this.timeout) {
    return await this.driver.wait(until.elementLocated(locator), customTimeout);
  }

  async waitForElementVisible(locator, customTimeout = this.timeout) {
    const element = await this.waitForElementLocated(locator, customTimeout);
    await this.driver.wait(until.elementIsVisible(element), customTimeout);
    return element;
  }

  async waitForElementClickable(locator, customTimeout = this.timeout) {
    const element = await this.waitForElementVisible(locator, customTimeout);
    await this.driver.wait(until.elementIsEnabled(element), customTimeout);
    return element;
  }

  // Interaction Wrappers
  async click(locator) {
    logger.info(`Clicking element: ${JSON.stringify(locator)}`);
    const element = await this.waitForElementClickable(locator);
    await element.click();
  }

  async type(locator, text) {
    logger.info(`Typing "${text}" into element: ${JSON.stringify(locator)}`);
    const element = await this.waitForElementVisible(locator);
    await element.clear();
    await element.sendKeys(text);
  }

  async clear(locator) {
    logger.info(`Clearing element: ${JSON.stringify(locator)}`);
    const element = await this.waitForElementVisible(locator);
    await element.clear();
  }

  async getText(locator) {
    const element = await this.waitForElementVisible(locator);
    const text = await element.getText();
    logger.info(`Get text from ${JSON.stringify(locator)}: "${text}"`);
    return text;
  }

  async isElementDisplayed(locator, customTimeout = 2000) {
    try {
      await this.waitForElementVisible(locator, customTimeout);
      return true;
    } catch (err) {
      return false;
    }
  }

  // Scrolling Helpers
  async scrollToElement(element) {
    logger.info('Scrolling to element via JavaScript');
    await this.driver.executeScript("arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });", element);
    await this.driver.sleep(500); // Wait briefly for scroll animations
  }

  // JavaScript Execution
  async executeScript(script, ...args) {
    return await this.driver.executeScript(script, ...args);
  }

  // Native Alert Handlers
  async acceptAlert() {
    logger.info('Accepting alert');
    await this.driver.wait(until.alertIsPresent(), this.timeout);
    const alert = await this.driver.switchTo().alert();
    const text = await alert.getText();
    await alert.accept();
    return text;
  }

  async dismissAlert() {
    logger.info('Dismissing alert');
    await this.driver.wait(until.alertIsPresent(), this.timeout);
    const alert = await this.driver.switchTo().alert();
    const text = await alert.getText();
    await alert.dismiss();
    return text;
  }

  // Screenshot Capture
  async takeScreenshot(testName) {
    try {
      const screenshotDir = path.join(__dirname, '../reports/failures');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const fileName = `${testName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      const filePath = path.join(screenshotDir, fileName);
      
      const image = await this.driver.takeScreenshot();
      fs.writeFileSync(filePath, image, 'base64');
      logger.info(`Screenshot saved to: [${filePath}]`);
      return filePath;
    } catch (err) {
      logger.error('Failed to capture screenshot:', err);
      return '';
    }
  }
}

module.exports = BasePage;
