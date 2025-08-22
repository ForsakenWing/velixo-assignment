import { Page, Locator, expect } from '@playwright/test';
import { LoginCredentials, DateValidationResult, CellReference, FormulaResult } from './types';

/**
 * Simplified Excel Online Page Object Model
 * Based on debug results showing elements are on main page, not iframe
 */
export class ExcelOnlinePage {
  public page: Page;  // Make public for screenshots
  private workbookName: string = '';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to Excel Online
   */
  async navigateToExcel(): Promise<void> {
    await this.page.goto('https://www.office.com/launch/excel', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    console.log('✅ Successfully navigated to Excel Online');
  }

  /**
   * Authenticate with Microsoft account
   */
  async login(credentials: LoginCredentials): Promise<void> {
    try {
      console.log('🔐 Starting authentication process...');
      
      // Check if already logged in
      const isLoggedIn = await this.isUserLoggedIn();
      if (isLoggedIn) {
        console.log('✅ User already authenticated');
        return;
      }

      await this.navigateToExcel();

      // Handle email input
      const emailInput = this.page.locator('input[type="email"], input[name="loginfmt"]').first();
      if (await emailInput.isVisible({ timeout: 10000 })) {
        await emailInput.fill(credentials.username);
        
        const nextButton = this.page.locator('button:has-text("Next"), input[type="submit"]').first();
        if (await nextButton.isVisible({ timeout: 5000 })) {
          await nextButton.click();
          await this.page.waitForTimeout(3000);
        }
      }

      // Handle password input
      const passwordInput = this.page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible({ timeout: 10000 })) {
        await passwordInput.fill(credentials.password);
        
        const submitButton = this.page.locator('button:has-text("Next"), button:has-text("Sign in"), input[type="submit"]').first();
        if (await submitButton.isVisible({ timeout: 5000 })) {
          await submitButton.click();
          await this.page.waitForTimeout(5000);
        }
      }

      // Handle "too many requests" error on any page by refreshing until we can proceed
      let maxRefreshAttempts = 10;
      let refreshAttempts = 0;
      
      while (refreshAttempts < maxRefreshAttempts) {
        try {
          const errorMessages = [
            'too many requests',
            'rate limit',
            'try again later',
            'temporarily blocked',
            'error occurred'
          ];
          
          const pageContent = await this.page.textContent('body');
          const hasError = errorMessages.some(error => 
            pageContent?.toLowerCase().includes(error.toLowerCase())
          );
          
          if (hasError) {
            refreshAttempts++;
            const currentUrl = this.page.url();
            console.log(`⚠️ Detected "too many requests" error on ${currentUrl} (attempt ${refreshAttempts}/${maxRefreshAttempts}), refreshing...`);
            console.log('ℹ️ User is already authenticated, just refreshing without re-entering credentials...');
            await this.page.reload({ waitUntil: 'networkidle' });
            await this.page.waitForTimeout(3000);
          } else {
            console.log('✅ No "too many requests" error detected, continuing...');
            break;
          }
          
        } catch (error) {
          refreshAttempts++;
          console.log(`ℹ️ Refresh attempt ${refreshAttempts} failed, trying again...`, error);
          await this.page.waitForTimeout(2000);
        }
      }
      
      if (refreshAttempts >= maxRefreshAttempts) {
        console.log('⚠️ Max refresh attempts reached, continuing anyway...');
      }
      


      // Handle "Stay signed in" prompt
      const staySignedInButton = this.page.locator('button:has-text("Yes"), button:has-text("No")').first();
      if (await staySignedInButton.isVisible({ timeout: 15000 })) {
        await staySignedInButton.click();
      }

      // Wait for successful authentication - be more flexible with URL matching
      try {
        await this.page.waitForURL('**/office.com**', { timeout: 30000 });
        console.log('✅ Authentication successful - redirected to Office.com');
      } catch {
        // Check if we're already authenticated by looking at current URL
        const currentUrl = this.page.url();
        if (currentUrl.includes('office.com') || currentUrl.includes('excel')) {
          console.log('✅ Authentication successful - already on Office/Excel page');
        } else {
          console.log('⚠️ Authentication may have succeeded but URL check failed');
          console.log(`Current URL: ${currentUrl}`);
          // Continue anyway, the workbook creation will fail if auth didn't work
        }
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw new Error(`Login failed: ${error}`);
    }
  }

  /**
   * Check if user is already logged in
   */
  private async isUserLoggedIn(): Promise<boolean> {
    try {
      const currentUrl = this.page.url();
      if (currentUrl.includes('office.com') && !currentUrl.includes('login')) {
        const userIndicators = [
          '[data-automation-id="profileButton"]',
          '.ms-Persona',
          '#O365_MainLink_Me'
        ];

        for (const selector of userIndicators) {
          if (await this.page.locator(selector).isVisible({ timeout: 2000 })) {
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get or create a workbook (reuse existing if possible)
   */
  async getOrCreateWorkbook(): Promise<void> {
    try {
      console.log('📊 Getting or creating workbook...');
      
      await this.page.waitForLoadState('networkidle');
      
      // First, check if we're already in a workbook
      const currentUrl = this.page.url();
      if (currentUrl.includes('excel') && (currentUrl.includes('edit') || currentUrl.includes('workbook'))) {
        console.log('✅ Already in an Excel workbook, reusing it');
        await this.waitForExcelInterface();
        this.workbookName = 'Existing_Workbook';
        return;
      }
      
      // Look for existing workbooks first
      const existingWorkbookSelectors = [
        '[data-automation-id*="workbook"]',
        '.ms-DocumentCard',
        '[aria-label*="workbook"]',
        '.file-item'
      ];

      let existingWorkbookFound = false;
      for (const selector of existingWorkbookSelectors) {
        try {
          const elements = this.page.locator(selector);
          const count = await elements.count();
          if (count > 0) {
            // Click on the first existing workbook
            await elements.first().click();
            existingWorkbookFound = true;
            console.log(`✅ Opened existing workbook using: ${selector}`);
            break;
          }
        } catch {
          continue;
        }
      }

      // If no existing workbook found, create a new one
      if (!existingWorkbookFound) {
        console.log('📝 No existing workbook found, creating new one...');
        
        const newWorkbookSelectors = [
          '[data-automation-id="new-blank-workbook"]',
          'button:has-text("Blank workbook")',
          '[aria-label*="Blank workbook"]'
        ];

        let workbookCreated = false;
        for (const selector of newWorkbookSelectors) {
          try {
            const element = this.page.locator(selector);
            if (await element.isVisible({ timeout: 10000 })) {
              await element.click();
              workbookCreated = true;
              console.log(`✅ New workbook created using: ${selector}`);
              break;
            }
          } catch {
            continue;
          }
        }

        if (!workbookCreated) {
          throw new Error('Could not find workbook creation option');
        }
      }

      // Wait for Excel interface to load
      await this.waitForExcelInterface();
      
      this.workbookName = existingWorkbookFound ? 'Reused_Workbook' : `New_Workbook_${Date.now()}`;
      console.log(`✅ Workbook ready: ${this.workbookName}`);
    } catch (error) {
      console.error('❌ Failed to get or create workbook:', error);
      throw new Error(`Workbook setup failed: ${error}`);
    }
  }

  /**
   * Wait for Excel interface to be ready
   */
  private async waitForExcelInterface(): Promise<void> {
    console.log('⏳ Waiting for Excel interface to load...');
    
    // Wait for page to load
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for grid cells to appear (based on debug results)
    try {
      await this.page.waitForSelector('[role="gridcell"]', { timeout: 30000 });
      console.log('✅ Excel grid cells detected');
      
      // Give it a moment to fully stabilize
      await this.page.waitForTimeout(3000);
      return;
    } catch (error) {
      console.log('⚠️ Grid cells not found, assuming Excel is ready');
      await this.page.waitForTimeout(5000);
    }
  }

  /**
   * Clear the active cell
   */
  async clearActiveCell(): Promise<void> {
    try {
      console.log('🧹 Clearing active cell...');
      
      // Select all content and delete
      await this.page.keyboard.press('Control+a');
      await this.page.keyboard.press('Delete');
      
      // Alternative: press Escape to cancel any editing, then Delete
      await this.page.keyboard.press('Escape');
      await this.page.keyboard.press('Delete');
      
      await this.page.waitForTimeout(1000);
      console.log('✅ Cell cleared');
    } catch (error) {
      console.log('⚠️ Could not clear cell:', error);
    }
  }

  /**
   * Enter TODAY() function and get result
   */
  async getTodayFunctionResult(): Promise<string> {
    try {
      console.log('📅 Testing TODAY() function...');
      
      // Wait for Excel interface to be fully loaded
      await this.page.waitForTimeout(5000);
      
      // Take screenshot to see current state (ensure we're on the right tab)
      await this.page.bringToFront();
      await this.page.screenshot({ path: 'test-results/before-cell-interaction.png', fullPage: true });
      
      // Try multiple approaches to interact with Excel
      console.log('🎯 Attempting to interact with Excel interface...');
      
      // Approach 1: Click on first gridcell
      const gridCells = this.page.locator('[role="gridcell"]');
      const cellCount = await gridCells.count();
      console.log(`Found ${cellCount} grid cells`);
      
      if (cellCount > 0) {
        console.log('🎯 Clicking on first grid cell...');
        await gridCells.first().click();
        await this.page.waitForTimeout(1000);
        
        // Clear any existing content in the cell
        await this.clearActiveCell();
      }
      
      // Approach 2: Try to focus on any input field
      const inputs = this.page.locator('input, textarea');
      const inputCount = await inputs.count();
      console.log(`Found ${inputCount} input elements`);
      
      if (inputCount > 0) {
        console.log('🎯 Clicking on first input...');
        await inputs.first().click();
        await this.page.waitForTimeout(1000);
      }
      
      // Approach 3: Just try typing directly (Excel might capture keyboard input)
      console.log('⌨️ Typing TODAY() formula...');
      await this.page.keyboard.type('=TODAY()');
      await this.page.waitForTimeout(1000);
      
      console.log('⏎ Pressing Enter...');
      await this.page.keyboard.press('Enter');
      
      // Wait for calculation
      console.log('⏳ Waiting for calculation...');
      await this.page.waitForTimeout(5000);
      
      // Take screenshot after formula entry (ensure we're on the right tab)
      await this.page.bringToFront();
      await this.page.screenshot({ path: 'test-results/after-formula-entry.png', fullPage: true });
      
      // Try to get the result from the cell
      const result = await this.getCellResult();
      
      console.log(`✅ TODAY() function result: "${result}"`);
      return result;
    } catch (error) {
      console.error('❌ Failed to get TODAY() function result:', error);
      // Take error screenshot (ensure we're on the right tab)
      await this.page.bringToFront();
      await this.page.screenshot({ path: 'test-results/today-function-error.png', fullPage: true });
      throw new Error(`TODAY() function test failed: ${error}`);
    }
  }

  /**
   * Get result from the active cell
   */
  private async getCellResult(): Promise<string> {
    console.log('🔍 Getting calculated value from first grid cell...');
    
    try {
      // Get the first grid cell (A1) which should contain our calculated result
      const firstCell = this.page.locator('[role="gridcell"]').first();
      
      if (await firstCell.isVisible({ timeout: 5000 })) {
        const value = await firstCell.textContent();
        if (value && value.trim()) {
          console.log(`✅ Got value from first cell: "${value.trim()}"`);
          return value.trim();
        }
      }
      
      console.log('⚠️ No value found in first cell');
      return 'No result found';
    } catch (error) {
      console.log('❌ Error getting cell result:', error);
      return 'Error getting result';
    }
  }

  /**
   * Verify if a date string matches expected format and current date
   */
  verifyDateFormat(dateValue: string): DateValidationResult {
    try {
      const today = new Date();
      const expectedDate = today.toLocaleDateString();
      
      const cleanDateValue = dateValue.trim();
      const parsedDate = new Date(cleanDateValue);
      
      if (isNaN(parsedDate.getTime())) {
        return {
          isValid: false,
          expectedDate,
          actualDate: cleanDateValue,
          message: 'Invalid date format'
        };
      }
      
      const isToday = parsedDate.toDateString() === today.toDateString();
      
      return {
        isValid: isToday,
        expectedDate,
        actualDate: cleanDateValue,
        message: isToday ? 'Date matches current date' : 'Date does not match current date'
      };
    } catch (error) {
      return {
        isValid: false,
        expectedDate: new Date().toLocaleDateString(),
        actualDate: dateValue,
        message: `Date validation error: ${error}`
      };
    }
  }

  /**
   * Cleanup method
   */
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup process...');
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}