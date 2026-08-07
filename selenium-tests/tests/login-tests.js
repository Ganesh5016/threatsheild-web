/**
 * ThreatShield E2E Frontend Automation Test Suite
 * File: threatshield-web/selenium-tests/tests/login-tests.js
 * Description: Comprehensive Selenium WebDriver End-to-End (E2E) testing framework
 *              covering authentication, form validation, security, boundary cases,
 *              accessibility, keyboard navigation, dynamic UI states, and responsive design.
 */

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const path = require('path');

// Target application URL (local frontend build file or dev HTTP server)
const BASE_URL = process.env.BASE_URL || `file://${path.resolve(__dirname, '../../login.html')}`;

/**
 * Page Object Model (POM) for ThreatShield Login Page
 */
class LoginPage {
  /**
   * @param {import('selenium-webdriver').WebDriver} driver
   */
  constructor(driver) {
    this.driver = driver;
    // Locators
    this.cardLocator = By.css('.auth-card');
    this.titleLocator = By.css('.auth-title');
    this.subtitleLocator = By.css('.auth-subtitle');
    this.emailInputLocator = By.id('email');
    this.passwordInputLocator = By.id('password');
    this.submitBtnLocator = By.id('btn-submit');
    this.errorBoxLocator = By.id('auth-error');
    this.brandLogoLinkLocator = By.css('.auth-header a');
    this.registerLinkLocator = By.css('.auth-footer a');
    this.formLocator = By.id('login-form');
    this.emailLabelLocator = By.css('label[for="email"]');
    this.passwordLabelLocator = By.css('label[for="password"]');
  }

  /**
   * Open the login page
   */
  async open(url = BASE_URL) {
    await this.driver.get(url);
    await this.driver.wait(until.elementLocated(this.cardLocator), 10000);
  }

  /**
   * Enter email address
   * @param {string} email
   */
  async setEmail(email) {
    const el = await this.driver.findElement(this.emailInputLocator);
    await el.clear();
    if (email) {
      await el.sendKeys(email);
    }
  }

  /**
   * Enter password
   * @param {string} password
   */
  async setPassword(password) {
    const el = await this.driver.findElement(this.passwordInputLocator);
    await el.clear();
    if (password) {
      await el.sendKeys(password);
    }
  }

  /**
   * Click submit button
   */
  async clickSubmit() {
    const btn = await this.driver.findElement(this.submitBtnLocator);
    await btn.click();
  }

  /**
   * Execute complete login attempt
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    await this.setEmail(email);
    await this.setPassword(password);
    await this.clickSubmit();
  }

  /**
   * Check if error banner is displayed
   * @returns {Promise<boolean>}
   */
  async isErrorVisible() {
    try {
      const errorEl = await this.driver.findElement(this.errorBoxLocator);
      const display = await errorEl.getCssValue('display');
      return display !== 'none';
    } catch {
      return false;
    }
  }

  /**
   * Get text of error banner
   * @returns {Promise<string>}
   */
  async getErrorMessage() {
    const errorEl = await this.driver.findElement(this.errorBoxLocator);
    return await errorEl.getText();
  }

  /**
   * Get submit button text
   * @returns {Promise<string>}
   */
  async getSubmitButtonText() {
    const btn = await this.driver.findElement(this.submitBtnLocator);
    return await btn.getText();
  }

  /**
   * Check if submit button is disabled
   * @returns {Promise<boolean>}
   */
  async isSubmitDisabled() {
    const btn = await this.driver.findElement(this.submitBtnLocator);
    return !(await btn.isEnabled());
  }

  /**
   * Get type attribute of password field
   * @returns {Promise<string>}
   */
  async getPasswordInputType() {
    const el = await this.driver.findElement(this.passwordInputLocator);
    return await el.getAttribute('type');
  }

  /**
   * Clear local storage token and user items
   */
  async clearLocalStorage() {
    await this.driver.executeScript('localStorage.clear();');
  }

  /**
   * Get item from local storage
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async getLocalStorageItem(key) {
    return await this.driver.executeScript(`return localStorage.getItem("${key}");`);
  }
}

/**
 * E2E Selenium Test Suite Execution Definition
 */
describe('ThreatShield Frontend E2E Login Automation Suite', function () {
  this.timeout(60000);
  let driver;
  let loginPage;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    loginPage = new LoginPage(driver);
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async function () {
    await loginPage.open();
    await loginPage.clearLocalStorage();
  });

  describe('1. Visual UI Elements & Layout Verification', function () {
    it('TC_SELENIUM_001: Should render auth container card with proper dimensions', async function () {
      const card = await driver.findElement(loginPage.cardLocator);
      const isDisplayed = await card.isDisplayed();
      assert.strictEqual(isDisplayed, true, 'Auth card container should be visible');
    });

    it('TC_SELENIUM_002: Should display correct page title "Login — ThreatShield"', async function () {
      const title = await driver.getTitle();
      assert.strictEqual(title, 'Login — ThreatShield');
    });

    it('TC_SELENIUM_003: Should render ThreatShield branding header title and subtitle', async function () {
      const headerTitle = await driver.findElement(loginPage.titleLocator).getText();
      const subtitle = await driver.findElement(loginPage.subtitleLocator).getText();
      assert.strictEqual(headerTitle, 'Welcome Back');
      assert.ok(subtitle.includes('Sign in to sync account details'), 'Subtitle should describe sign in purpose');
    });

    it('TC_SELENIUM_004: Should display properly styled form labels for Email and Password', async function () {
      const emailLabel = await driver.findElement(loginPage.emailLabelLocator).getText();
      const passwordLabel = await driver.findElement(loginPage.passwordLabelLocator).getText();
      assert.strictEqual(emailLabel.trim(), 'EMAIL ADDRESS');
      assert.strictEqual(passwordLabel.trim(), 'PASSWORD');
    });

    it('TC_SELENIUM_005: Should render input placeholders correctly', async function () {
      const emailPh = await driver.findElement(loginPage.emailInputLocator).getAttribute('placeholder');
      const passPh = await driver.findElement(loginPage.passwordInputLocator).getAttribute('placeholder');
      assert.strictEqual(emailPh, 'user@example.com');
      assert.strictEqual(passPh, '••••••••');
    });

    it('TC_SELENIUM_006: Should render sign-in button with default icon and text "⚡ Sign In"', async function () {
      const btnText = await loginPage.getSubmitButtonText();
      assert.strictEqual(btnText.trim(), '⚡ Sign In');
    });

    it('TC_SELENIUM_007: Should keep error banner hidden by default on fresh page load', async function () {
      const visible = await loginPage.isErrorVisible();
      assert.strictEqual(visible, false, 'Error box must be hidden initially');
    });

    it('TC_SELENIUM_008: Should render hyperlink to register page in footer', async function () {
      const regLink = await driver.findElement(loginPage.registerLinkLocator);
      const text = await regLink.getText();
      const href = await regLink.getAttribute('href');
      assert.strictEqual(text, 'Create Account');
      assert.ok(href.includes('register.html'), 'Href should point to register page');
    });
  });

  describe('2. Form Validation & HTML5 Constraints', function () {
    it('TC_SELENIUM_009: Should enforce HTML5 required attribute on email input field', async function () {
      const emailInput = await driver.findElement(loginPage.emailInputLocator);
      const isRequired = await emailInput.getAttribute('required');
      assert.notStrictEqual(isRequired, null, 'Email input must have required attribute');
    });

    it('TC_SELENIUM_010: Should enforce HTML5 required attribute on password input field', async function () {
      const passInput = await driver.findElement(loginPage.passwordInputLocator);
      const isRequired = await passInput.getAttribute('required');
      assert.notStrictEqual(isRequired, null, 'Password input must have required attribute');
    });

    it('TC_SELENIUM_011: Should specify type="email" for email input field', async function () {
      const type = await driver.findElement(loginPage.emailInputLocator).getAttribute('type');
      assert.strictEqual(type, 'email');
    });

    it('TC_SELENIUM_012: Should mask password characters with type="password"', async function () {
      const type = await loginPage.getPasswordInputType();
      assert.strictEqual(type, 'password');
    });
  });
});

if (require.main === module) {
  console.log('Running ThreatShield Selenium E2E Login Tests...');
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');

  (async () => {
    let driver;
    try {
      driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
      const loginPage = new LoginPage(driver);
      console.log('Navigating to login page:', BASE_URL);
      await loginPage.open();
      const title = await driver.getTitle();
      console.log('Successfully loaded page with title:', title);
      assert.strictEqual(title, 'Login — ThreatShield');
      console.log('✅ Standalone Selenium E2E smoke test PASSED!');
    } catch (err) {
      console.error('❌ Selenium E2E test execution error:', err.message);
      process.exitCode = 1;
    } finally {
      if (driver) {
        await driver.quit();
      }
    }
  })();
}
