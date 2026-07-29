const { By } = require('selenium-webdriver');
const BasePage = require('./basePage');
const { logStep } = require('../utilities/logger');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    
    // Locators
    this.portalGatewayBtn = By.xpath("//button[contains(text(), 'Portal Gateway')]");
    this.accessColonyBtn = By.xpath("//button[contains(text(), 'Access Colony Board')]");
    this.usernameInput = By.id('input-username');
    this.passwordInput = By.id('input-password');
    this.loginBtn = By.id('btn-login');
    this.errorMsg = By.id('auth-error-output');
    this.logoutBtn = By.xpath("//button[contains(text(), 'Disconnect')]");
    this.welcomeText = By.id('dash-welcome-title');
  }

  async openPortal() {
    await this.click(this.portalGatewayBtn);
    logStep('LoginFlow', 'Navigated to Sign In Gateway');
  }

  async login(username, password) {
    logStep('LoginFlow', `Attempting Login: Username=[${username}]`);
    await this.type(this.usernameInput, username);
    await this.type(this.passwordInput, password);
    await this.click(this.loginBtn);
  }

  async getErrorMessage() {
    return await this.getText(this.errorMsg);
  }

  async isWelcomeDisplayed() {
    return await this.isElementDisplayed(this.welcomeText);
  }

  async logout() {
    logStep('LoginFlow', 'Clicking Disconnect logout button');
    await this.click(this.logoutBtn);
  }
}

module.exports = LoginPage;
