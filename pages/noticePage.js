const { By } = require('selenium-webdriver');
const BasePage = require('./basePage');
const { logStep } = require('../utilities/logger');

class NoticePage extends BasePage {
  constructor(driver) {
    super(driver);

    // Notice Feed Locators
    this.searchInput = By.id('board-search-input');
    this.noticeCards = By.css('.sub-view#sub-board .notice-card');
    this.upvoteBtn = By.xpath("//button[contains(text(), 'Upvote')]");
    this.payloadBtn = By.xpath("//span[contains(text(), 'Full Payload')]");

    // Publish Notice Locators
    this.pubTitle = By.id('pub-title');
    this.pubCategory = By.id('pub-category');
    this.pubUrgency = By.id('pub-urgency');
    this.pubDesc = By.id('pub-desc');
    this.pubSubmitBtn = By.xpath("//button[contains(text(), 'Deploy Notice')]");

    // Profile Locators
    this.profNickname = By.id('prof-nickname');
    this.profSaveBtn = By.xpath("//button[contains(text(), 'Update Registry Token')]");

    // Admin Command Locators
    this.purgeBtn = By.xpath("//button[contains(text(), 'Purge BroadCast')]");
  }

  // Notice Feed Methods
  async searchNotice(query) {
    logStep('NoticeFlow', `Searching notices for keyword: "${query}"`);
    await this.type(this.searchInput, query);
  }

  async getNoticeCount() {
    const list = await this.driver.findElements(this.noticeCards);
    return list.length;
  }

  async upvoteFirstNotice() {
    logStep('NoticeFlow', 'Upvoting first notice element in list');
    await this.click(this.upvoteBtn);
  }

  // Publish Form Methods
  async publishNotice(title, category, urgency, desc) {
    logStep('NoticeFlow', `Filling publish notice: Title=[${title}], Category=[${category}]`);
    await this.type(this.pubTitle, title);
    await this.type(this.pubDesc, desc);
    
    // Select category dropdown option
    const catSelect = await this.waitForElementVisible(this.pubCategory);
    await catSelect.sendKeys(category);

    // Select urgency dropdown option
    const urgSelect = await this.waitForElementVisible(this.pubUrgency);
    await urgSelect.sendKeys(urgency);

    await this.click(this.pubSubmitBtn);
    logStep('NoticeFlow', 'Submitting publish notice form');
  }

  // Profile Methods
  async updateNickname(nickname) {
    logStep('ProfileFlow', `Updating profile nickname to: [${nickname}]`);
    await this.type(this.profNickname, nickname);
    await this.click(this.profSaveBtn);
  }

  // Admin Methods
  async purgeFirstNotice() {
    logStep('AdminFlow', 'Purging first notice from list');
    await this.click(this.purgeBtn);
  }
}

module.exports = NoticePage;
