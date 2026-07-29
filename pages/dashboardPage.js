const { By } = require('selenium-webdriver');
const BasePage = require('./basePage');
const { logStep } = require('../utilities/logger');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Sidebar Navigation Links
    this.navDashboard = By.id('nav-dashboard');
    this.navBoard = By.id('nav-board');
    this.navPublish = By.id('nav-publish');
    this.navProfile = By.id('nav-profile');
    this.navAdmin = By.id('nav-admin');

    // Dashboard Stats Card Values
    this.statActive = By.id('stat-active');
    this.statUrgent = By.id('stat-urgent');
    this.statZone = By.id('stat-zone');

    // Theme and Modal Controls
    this.toggleThemeBtn = By.xpath("//button[contains(text(), 'Toggle Light/Dark')]");
    this.openParametersBtn = By.xpath("//button[contains(text(), 'Open Parameters')]");
    
    // Modal Overlay Locators
    this.modalOverlay = By.id('notice-modal');
    this.modalTitle = By.id('modal-title');
    this.dismissModalBtn = By.xpath("//button[contains(text(), 'Dismiss Frame')]");
  }

  async navigateToTab(tabName) {
    logStep('NavigationFlow', `Switching to view tab: [${tabName}]`);
    switch (tabName.toLowerCase()) {
      case 'dashboard':
        await this.click(this.navDashboard);
        break;
      case 'board':
        await this.click(this.navBoard);
        break;
      case 'publish':
        await this.click(this.navPublish);
        break;
      case 'profile':
        await this.click(this.navProfile);
        break;
      case 'admin':
        await this.click(this.navAdmin);
        break;
      default:
        throw new Error(`Tab [${tabName}] not mapped in POM`);
    }
  }

  async getStatActiveCount() {
    return await this.getText(this.statActive);
  }

  async getStatUrgentCount() {
    return await this.getText(this.statUrgent);
  }

  async toggleTheme() {
    logStep('UITesting', 'Toggling app layout dark/light theme');
    await this.click(this.toggleThemeBtn);
  }

  async openFirstTrendingNotice() {
    logStep('UITesting', 'Opening parameters modal for first notice item');
    await this.click(this.openParametersBtn);
  }

  async isModalDisplayed() {
    return await this.isElementDisplayed(this.modalTitle);
  }

  async dismissModal() {
    logStep('UITesting', 'Dismissing modal detail window');
    await this.click(this.dismissModalBtn);
  }
}

module.exports = DashboardPage;
