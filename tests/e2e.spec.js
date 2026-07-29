const { expect } = require('chai');
const { setupHooks, getDriver } = require('./baseTest');
const LoginPage = require('../pages/loginPage');
const DashboardPage = require('../pages/dashboardPage');
const NoticePage = require('../pages/noticePage');
const config = require('../config/config');

describe('LocalPulse Web Portal End-to-End Automation Suite', function() {
  let driver;
  let loginPage;
  let dashboardPage;
  let noticePage;

  this.timeout(60000); // 60s timeout for browser interactions

  before(async function() {
    const context = await setupHooks.beforeAll();
    driver = context.driver;
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    noticePage = new NoticePage(driver);
  });

  after(async function() {
    await setupHooks.afterAll();
  });

  beforeEach(async function() {
    await setupHooks.beforeEach(this);
  });

  afterEach(async function() {
    await setupHooks.afterEach(this);
  });

  // =========================================================================
  // 1. AUTHENTICATION & FORM REGISTRY RULES TESTS
  // =========================================================================
  describe('Authentication Gates & Inputs Verification', function() {
    
    it('Should block login attempt with empty credentials', async function() {
      await loginPage.navigateTo(config.appUrl);
      await loginPage.openPortal();
      
      // Submit empty username and password
      await loginPage.login('', '');
      await driver.sleep(1000); // Wait for mock validation delay
      
      const errMsg = await loginPage.getErrorMessage();
      expect(errMsg).to.include('Invalid verification pairing');
    });

    it('Should block login attempt with invalid credentials', async function() {
      await loginPage.login('wrong_user', 'wrong_pass');
      await driver.sleep(1000);
      
      const errMsg = await loginPage.getErrorMessage();
      expect(errMsg).to.include('Invalid verification pairing');
    });

    it('Should login successfully as a Resident', async function() {
      await loginPage.login('resident', 'resident123');
      await driver.sleep(1000);
      
      const welcomeIsDisplayed = await loginPage.isWelcomeDisplayed();
      expect(welcomeIsDisplayed).to.be.true;
    });

    it('Should logout successfully from the portal dashboard', async function() {
      await loginPage.logout();
      await driver.sleep(1000);
      
      const isPortalBtnVisible = await loginPage.isElementDisplayed(loginPage.portalGatewayBtn);
      expect(isPortalBtnVisible).to.be.true;
    });

    it('Should login successfully as an Admin', async function() {
      await loginPage.openPortal();
      await loginPage.login('admin', '123');
      await driver.sleep(1000);
      
      const welcomeIsDisplayed = await loginPage.isWelcomeDisplayed();
      expect(welcomeIsDisplayed).to.be.true;
    });
  });

  // =========================================================================
  // 2. DASHBOARD VIEW & LAYOUT CUSTOMIZATION TESTS
  // =========================================================================
  describe('Dashboard Widgets & UI Elements Verification', function() {
    
    it('Should toggle theme light/dark modes', async function() {
      // Toggle once to dark
      await dashboardPage.toggleTheme();
      const themeAttrDark = await driver.findElement({ xpath: '/html' }).getAttribute('data-theme');
      expect(themeAttrDark).to.equal('dark');
      
      // Toggle back to light
      await dashboardPage.toggleTheme();
      const themeAttrLight = await driver.findElement({ xpath: '/html' }).getAttribute('data-theme');
      expect(themeAttrLight).to.equal('light');
    });

    it('Should open and close notice parameters modal', async function() {
      await dashboardPage.openFirstTrendingNotice();
      await driver.sleep(500); // Wait for modal load animation
      
      const isModalVisible = await dashboardPage.isModalDisplayed();
      expect(isModalVisible).to.be.true;
      
      await dashboardPage.dismissModal();
      await driver.sleep(500);
    });
  });

  // =========================================================================
  // 3. NOTICE BOARD BROADCASTS & DYNAMIC SEARCH TESTS
  // =========================================================================
  describe('Notice Broadcast Board & Form Posting Verification', function() {
    
    it('Should navigate through sidebar tabs successfully', async function() {
      await dashboardPage.navigateToTab('board');
      await driver.sleep(500);
      
      const initialNoticeCount = await noticePage.getNoticeCount();
      expect(initialNoticeCount).to.be.greaterThan(0);
    });

    it('Should search and filter notices by keyword', async function() {
      await noticePage.searchNotice('Water');
      await driver.sleep(500);
      
      const filteredCount = await noticePage.getNoticeCount();
      expect(filteredCount).to.be.greaterThan(0);
      
      // Reset search
      await noticePage.clear(noticePage.searchInput);
      await noticePage.searchNotice('');
      await driver.sleep(500);
    });

    it('Should fail to deploy notice with empty form fields', async function() {
      await dashboardPage.navigateToTab('publish');
      await driver.sleep(500);
      
      await noticePage.publishNotice('', 'power', 'urgent', '');
      
      // Accept notice input validation alert prompt
      const alertText = await noticePage.acceptAlert();
      expect(alertText).to.include('Structural data values cannot be null');
    });

    it('Should deploy new notice successfully when form is filled', async function() {
      const noticeTitle = 'E2E Automated System Test Notice';
      const noticeDesc = 'Automated validation sequence deployment for infrastructure monitoring.';
      
      await noticePage.publishNotice(noticeTitle, 'security', 'urgent', noticeDesc);
      
      // Accept confirmation alert prompt
      const confirmAlertText = await noticePage.acceptAlert();
      expect(confirmAlertText).to.include('deployed onto local ledger');
      
      // Should automatically redirect back to board tab
      await driver.sleep(1000);
      await noticePage.searchNotice(noticeTitle);
      await driver.sleep(500);
      
      const noticeCount = await noticePage.getNoticeCount();
      expect(noticeCount).to.equal(1);
    });
  });

  // =========================================================================
  // 4. ADMIN DESK PURGE OPERATIONS TESTS
  // =========================================================================
  describe('Admin Moderation Board Actions Verification', function() {
    
    it('Should navigate to Admin Command tab', async function() {
      await dashboardPage.navigateToTab('admin');
      await driver.sleep(500);
      
      const isPurgeBtnVisible = await noticePage.isElementDisplayed(noticePage.purgeBtn);
      expect(isPurgeBtnVisible).to.be.true;
    });

    it('Should purge broadcast notice from admin terminal list', async function() {
      await noticePage.purgeFirstNotice();
      
      // Handle delete confirm alert
      const confirmText = await noticePage.acceptAlert();
      expect(confirmText).to.include('Execute irreversible database deletion');
      await driver.sleep(500);
    });
  });
});
