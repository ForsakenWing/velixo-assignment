import { Page, BrowserContext, expect } from '@playwright/test';
import { ExcelOnlinePage } from './excel-page';
import { ConfigLoader } from './config-loader';
import { DateUtils } from './date-utils';
import { BrowserUtils } from './browser-utils';
import * as testData from '../fixtures/test-data.json';

/**
 * Centralized test utilities for Excel Online E2E testing
 */
export class TestUtils {
  private static configLoader = ConfigLoader.getInstance();

  /**
   * Create and configure an Excel Online page instance
   */
  static async createExcelPage(page: Page): Promise<ExcelOnlinePage> {
    // Set up console logging and dialog handlers
    BrowserUtils.setupConsoleLogging(page);
    BrowserUtils.setupDialogHandlers(page);

    // Create Excel page instance
    const excelPage = new ExcelOnlinePage(page);
    
    return excelPage;
  }

  /**
   * Perform complete Excel Online authentication flow
   */
  static async authenticateExcelOnline(excelPage: ExcelOnlinePage): Promise<void> {
    const config = this.configLoader.getExcelConfig();
    
    // Check if credentials are properly configured
    if (config.credentials.username.includes('example.com') || 
        config.credentials.username.includes('YOUR_REAL')) {
      throw new Error('Please configure real Microsoft credentials in test-config.json. Template credentials will not work.');
    }
    
    await excelPage.login(config.credentials);
  }

  /**
   * Set up a new workbook for testing
   */
  static async setupTestWorkbook(excelPage: ExcelOnlinePage): Promise<void> {
    await excelPage.createNewWorkbook();
    
    // Wait for Excel interface to be ready and stable
    await BrowserUtils.sleep(3000);
    
    // Verify we can interact with the workbook
    try {
      await excelPage.selectCell('A1');
      console.log('✅ Workbook is ready for testing');
    } catch (error) {
      console.warn('⚠️ Could not verify workbook readiness:', error);
      // Continue anyway - the test will fail if the workbook isn't ready
    }
  }

  /**
   * Test TODAY() function and validate result
   */
  static async testTodayFunction(excelPage: ExcelOnlinePage): Promise<{
    success: boolean;
    result: string;
    validation: any;
  }> {
    try {
      console.log('🧪 Starting TODAY() function test...');
      
      // Select cell A1 for testing
      await excelPage.selectCell('A1');
      
      // Enter TODAY() function
      await excelPage.enterFormula('=TODAY()');
      
      // Wait for calculation to complete
      await BrowserUtils.sleep(2000);
      
      // Get the result
      const result = await excelPage.getCellValue('A1');
      
      console.log(`📊 TODAY() function returned: ${result}`);
      
      // Validate the result
      const validation = DateUtils.validateTodayFunction(result);
      
      return {
        success: validation.isValid,
        result,
        validation
      };
    } catch (error) {
      console.error('❌ TODAY() function test failed:', error);
      return {
        success: false,
        result: '',
        validation: {
          isValid: false,
          message: `Test failed: ${error}`
        }
      };
    }
  }

  /**
   * Clean up test environment
   */
  static async cleanupTest(
    excelPage: ExcelOnlinePage, 
    page: Page, 
    context?: BrowserContext
  ): Promise<void> {
    try {
      // Take final screenshot for documentation
      await BrowserUtils.takeScreenshot(page, 'test-cleanup');
      
      // Clean up Excel artifacts
      await excelPage.cleanup();
      
      // Clear browser data if context provided
      if (context) {
        await BrowserUtils.clearBrowserData(context);
      }
      
      console.log('✅ Test cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      // Don't throw during cleanup
    }
  }

  /**
   * Get test configuration
   */
  static getConfig() {
    return this.configLoader.loadConfig();
  }

  /**
   * Get test data fixtures
   */
  static getTestData() {
    return testData;
  }

  /**
   * Create test assertions for Excel results
   */
  static createExcelAssertions() {
    return {
      /**
       * Assert that a value looks like a date
       */
      async toBeValidDate(received: string) {
        const isValid = DateUtils.looksLikeDate(received);
        return {
          message: () => `Expected "${received}" to be a valid date format`,
          pass: isValid
        };
      },

      /**
       * Assert that a date matches today
       */
      async toBeTodaysDate(received: string) {
        const validation = DateUtils.validateTodayFunction(received);
        return {
          message: () => validation.message,
          pass: validation.isValid
        };
      },

      /**
       * Assert that Excel formula result is correct
       */
      async toMatchExcelResult(received: string, expected: string) {
        const normalizedReceived = received.trim().toLowerCase();
        const normalizedExpected = expected.trim().toLowerCase();
        
        return {
          message: () => `Expected Excel result "${received}" to match "${expected}"`,
          pass: normalizedReceived === normalizedExpected
        };
      }
    };
  }

  /**
   * Retry a test operation with custom retry logic
   */
  static async retryTestOperation<T>(
    operation: () => Promise<T>,
    testName: string,
    maxRetries: number = 3
  ): Promise<T> {
    return BrowserUtils.retryOperation(
      async () => {
        console.log(`🔄 Executing test operation: ${testName}`);
        return await operation();
      },
      maxRetries,
      2000 // 2 second base delay
    );
  }

  /**
   * Generate unique test identifiers
   */
  static generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log test step with formatting
   */
  static logTestStep(step: string, details?: any): void {
    console.log(`\n🧪 TEST STEP: ${step}`);
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  /**
   * Validate test environment before running tests
   */
  static async validateTestEnvironment(): Promise<void> {
    const config = this.configLoader.loadConfig();
    
    // Check if credentials are properly configured
    const invalidCredentials = [
      'example.com',
      'YOUR_REAL',
      'YOUR_EMAIL',
      'YOUR_PASSWORD',
      'test@example.com'
    ];
    
    const hasInvalidCredentials = invalidCredentials.some(invalid => 
      config.excel.credentials.username.includes(invalid) || 
      config.excel.credentials.password.includes(invalid)
    );
    
    if (hasInvalidCredentials) {
      throw new Error(`
❌ Invalid test credentials detected!

Please update e2e-automation/config/test-config.json with real Microsoft credentials:

{
  "excel": {
    "credentials": {
      "username": "your-real-email@outlook.com",
      "password": "your-real-password"
    }
  }
}

⚠️  IMPORTANT: 
- Use a real Microsoft account (Outlook, Hotmail, or Office 365)
- The account must have access to Excel Online
- Never commit real credentials to version control
- Consider using environment variables for CI/CD

Template credentials will not work with Microsoft's authentication system.
      `);
    }
    
    // Check if running in CI with proper environment variables
    if (this.configLoader.isCI()) {
      if (!process.env.EXCEL_USERNAME || !process.env.EXCEL_PASSWORD) {
        throw new Error('CI environment requires EXCEL_USERNAME and EXCEL_PASSWORD environment variables');
      }
    }
    
    console.log('✅ Test environment validation passed');
    console.log(`📧 Using credentials for: ${config.excel.credentials.username}`);
  }
}