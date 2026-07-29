const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { logger } = require('./logger');

async function runSmartScanner() {
  logger.info('=== Starting Smart QA Crawler: Dynamic Form & Route Discovery ===');
  
  // Set up headless chrome
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  const metadata = {
    scanTime: new Date().toISOString(),
    discoveredPages: [],
    discoveredForms: [],
    discoveredNavigation: []
  };

  try {
    await driver.get(config.appUrl);
    logger.info(`Opened application root page: ${config.appUrl}`);
    await driver.sleep(1000);

    // 1. Discover App Container Pages/Views
    const containers = await driver.findElements(By.className('page-container'));
    for (const container of containers) {
      const pageId = await container.getAttribute('id');
      metadata.discoveredPages.push({
        elementId: pageId,
        isActive: (await container.getAttribute('class')).includes('active-page')
      });
      logger.info(`Discovered Page Container: [${pageId}]`);
    }

    // 2. Discover Input Fields & Validation Rules
    const inputs = await driver.findElements(By.tagName('input'));
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const isRequired = await input.getAttribute('required');

      const parentForm = await input.findElement(By.xpath('..')).catch(() => null);
      let formName = 'Global';
      if (parentForm) {
        const classVal = await parentForm.getAttribute('class');
        if (classVal) formName = classVal;
      }

      metadata.discoveredForms.push({
        form: formName,
        fieldId: id,
        fieldType: type,
        placeholder: placeholder,
        required: isRequired === 'true'
      });
      logger.info(`Discovered Input Field: ID=[${id}], Type=[${type}], Form=[${formName}]`);
    }

    // 3. Discover Select Dropdowns
    const selects = await driver.findElements(By.tagName('select'));
    for (const select of selects) {
      const id = await select.getAttribute('id');
      const optionsElements = await select.findElements(By.tagName('option'));
      const optionsValues = [];
      for (const opt of optionsElements) {
        optionsValues.push(await opt.getAttribute('value'));
      }
      metadata.discoveredForms.push({
        form: 'NoticePublishForm',
        fieldId: id,
        fieldType: 'select',
        options: optionsValues
      });
      logger.info(`Discovered Select Dropdown: ID=[${id}], Options=[${optionsValues.join(', ')}]`);
    }

    // 4. Discover Navigation Links / Switch triggers
    const navItems = await driver.findElements(By.xpath("//*[contains(@onclick, 'router') or contains(@onclick, 'switchAppView')]"));
    for (const item of navItems) {
      const label = await item.getText();
      const clickAction = await item.getAttribute('onclick');
      metadata.discoveredNavigation.push({
        label: label.trim(),
        action: clickAction
      });
      logger.info(`Discovered Navigation Control: Label=[${label.trim()}], Action=[${clickAction}]`);
    }

    // Save metadata
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, 'discovered_metadata.json'), JSON.stringify(metadata, null, 2));
    logger.info('Smart Scanner completed. Discovery metadata saved to data/discovered_metadata.json');

  } catch (err) {
    logger.error('Error running Smart Scanner crawler:', err);
  } finally {
    await driver.quit();
  }
}

if (require.main === module) {
  runSmartScanner();
}

module.exports = { runSmartScanner };
