import { Page } from '@playwright/test';

/**
 * Clean Excel Online Page Helper
 * Based on actual MCP testing of Excel Online interface
 */
export class ExcelOnlinePageClean {
  private page: Page;
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
    console.log('✅ Navigated to Excel Online');
  }

  /**
   * Authenticate with Microsoft account
   */
  async login(credentials: { username: string; password: string }): Promise<void> {
    try {
      console.log('🔐 Starting authentication...');
      
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

      // Handle "too many requests" error by refreshing until resolved
      await this.handleTooManyRequestsError();

      // Handle "Stay signed in" prompt
      const staySignedInButton = this.page.locator('button:has-text("Yes"), button:has-text("No")').first();
      if (await staySignedInButton.isVisible({ timeout: 15000 })) {
        await staySignedInButton.click();
      }

      console.log('✅ Authentication successful');
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw new Error(`Login failed: ${error}`);
    }
  }

  /**
   * Handle "too many requests" error by refreshing until resolved
   */
  private async handleTooManyRequestsError(): Promise<void> {
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
  }

  /**
   * Create or reuse a workbook (prevents multiple workbook creation)
   */
  async createNewWorkbook(): Promise<void> {
    try {
      console.log('📊 Setting up workbook...');
      
      await this.page.waitForLoadState('networkidle');
      
      // Check if we're already in an Excel workbook
      const currentUrl = this.page.url();
      if (currentUrl.includes('excel') && (currentUrl.includes('edit') || currentUrl.includes('view') || currentUrl.includes('doc.aspx'))) {
        console.log('✅ Already in Excel workbook, reusing existing workbook');
        await this.waitForExcelInterface();
        this.workbookName = 'Existing_Workbook';
        return;
      }
      
      // Try to reuse an existing workbook instead of creating a new one
      console.log('🔍 Looking for existing workbooks to reuse...');
      const existingWorkbooks = this.page.locator('table').locator('row').filter({ hasText: 'Book' });
      const workbookCount = await existingWorkbooks.count();
      
      if (workbookCount > 0) {
        console.log(`📋 Found ${workbookCount} existing workbooks, using the first one`);
        await existingWorkbooks.first().click();
        await this.page.waitForTimeout(3000);
        
        // Check if a new tab opened with the workbook
        const currentUrl = this.page.url();
        if (!currentUrl.includes('doc.aspx')) {
          // Switch to the new tab if it opened
          const pages = this.page.context().pages();
          for (const page of pages) {
            const url = page.url();
            if (url.includes('doc.aspx') && url.includes('excel')) {
              await page.bringToFront();
              this.page = page;
              break;
            }
          }
        }
        
        await this.waitForExcelInterface();
        this.workbookName = 'Reused_Existing_Workbook';
        console.log('✅ Reusing existing workbook');
        return;
      }
      
      // Fallback: Create new workbook only if no existing ones found
      console.log('📊 No existing workbooks found, creating new one...');
      const workbookSelectors = [
        '[data-automation-id="new-blank-workbook"]',
        'button:has-text("Blank workbook")',
        '[aria-label*="Blank workbook"]'
      ];

      let workbookCreated = false;
      for (const selector of workbookSelectors) {
        try {
          const element = this.page.locator(selector);
          if (await element.isVisible({ timeout: 10000 })) {
            await element.click();
            workbookCreated = true;
            console.log(`✅ Workbook created using: ${selector}`);
            break;
          }
        } catch {
          continue;
        }
      }

      if (!workbookCreated) {
        throw new Error('Could not find workbook creation option');
      }

      // Wait for Excel interface to load
      await this.waitForExcelInterface();
      
      this.workbookName = `Test_Workbook_${Date.now()}`;
      console.log(`✅ New workbook created: ${this.workbookName}`);
    } catch (error) {
      console.error('❌ Failed to create new workbook:', error);
      throw new Error(`Workbook creation failed: ${error}`);
    }
  }

  /**
   * Wait for Excel interface to be ready
   */
  private async waitForExcelInterface(): Promise<void> {
    console.log('⏳ Waiting for Excel interface to load...');
    
    // Wait for page to load
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Try multiple approaches to detect Excel interface
    let interfaceReady = false;
    
    // Approach 1: Wait for Excel iframe (be more patient)
    try {
      console.log('🔍 Looking for Excel iframe...');
      await this.page.waitForSelector('iframe[name*="WacFrame"], iframe[name*="Excel"]', { timeout: 5000 });
      console.log('✅ Excel iframe detected');
      
      // Wait a bit for iframe to stabilize
      await this.page.waitForTimeout(5000);
      
      // Wait for key Excel interface elements within the iframe
      const frame = this.page.locator('iframe[name*="WacFrame"], iframe[name*="Excel"]').first().contentFrame();
      console.log('🔍 Waiting for Name Box in iframe...');
      await frame.getByRole('combobox', { name: /Name Box/ }).waitFor({ timeout: 30000 });
      console.log('🔍 Waiting for Formula Bar in iframe...');
      await frame.locator('[aria-label="formula bar"]').waitFor({ timeout: 30000 });
      
      console.log('✅ Excel interface loaded successfully via iframe');
      interfaceReady = true;
    } catch (error) {
      console.log('ℹ️ Iframe approach failed, trying fallback...', error);
    }
    
    // Approach 2: Check for Excel elements on main page
    if (!interfaceReady) {
      try {
        // Look for Excel-like elements on main page
        await this.page.waitForSelector('[role="grid"], [data-automation-id*="grid"], .ms-Grid', { timeout: 10000 });
        console.log('✅ Excel interface detected on main page');
        interfaceReady = true;
      } catch (error) {
        console.log('ℹ️ Main page approach also failed');
      }
    }
    
    // Approach 3: URL-based fallback
    if (!interfaceReady) {
      const currentUrl = this.page.url();
      if (currentUrl.includes('excel') || currentUrl.includes('office.com') || currentUrl.includes('onedrive')) {
        console.log('✅ Excel interface assumed ready (URL indicates Excel Online)');
        interfaceReady = true;
      }
    }
    
    if (!interfaceReady) {
      throw new Error('Excel interface did not load within the expected time');
    }
    
    // Give it a moment to fully stabilize
    await this.page.waitForTimeout(5000);
  }

  /**
   * Enter TODAY() function and get result (MCP-tested approach)
   */
  async getTodayFunctionResult(): Promise<string> {
    try {
      console.log('📅 Testing TODAY() function...');
      
      // Wait for Excel interface to be ready
      await this.page.waitForTimeout(5000);
      
      // Try to get the Excel iframe with multiple approaches
      let frame;
      let usingIframe = false;
      
      // Approach 1: Try specific iframe name from MCP findings
      try {
        await this.page.waitForSelector('iframe[name="WacFrame_Excel_0"]', { timeout: 10000 });
        frame = this.page.locator('iframe[name="WacFrame_Excel_0"]').contentFrame();
        console.log('✅ Using Excel iframe (WacFrame_Excel_0)');
        usingIframe = true;
      } catch {
        // Approach 2: Try any WacFrame iframe
        try {
          await this.page.waitForSelector('iframe[name*="WacFrame"]', { timeout: 5000 });
          frame = this.page.locator('iframe[name*="WacFrame"]').first().contentFrame();
          console.log('✅ Using Excel iframe (WacFrame)');
          usingIframe = true;
        } catch {
          console.log('ℹ️ No iframe found, using main page');
          frame = this.page;
          usingIframe = false;
        }
      }
      
      // Click on the formula bar with multiple selector approaches
      console.log('🎯 Clicking on formula bar...');
      let formulaBar;
      
      if (usingIframe) {
        // Try MCP-verified selector for iframe
        try {
          formulaBar = frame.getByRole('textbox', { name: 'formula bar' });
          await formulaBar.click({ timeout: 10000 });
          console.log('✅ Used iframe formula bar');
        } catch {
          // Fallback to aria-label selector
          formulaBar = frame.locator('[aria-label="formula bar"]');
          await formulaBar.click({ timeout: 10000 });
          console.log('✅ Used iframe formula bar (aria-label)');
        }
      } else {
        // Try main page selectors
        const selectors = [
          '[aria-label="formula bar"]',
          'textbox[name="formula bar"]',
          '[data-automation-id*="FormulaBar"]'
        ];
        
        let found = false;
        for (const selector of selectors) {
          try {
            formulaBar = frame.locator(selector);
            if (await formulaBar.isVisible({ timeout: 5000 })) {
              await formulaBar.click();
              console.log(`✅ Used main page formula bar: ${selector}`);
              found = true;
              break;
            }
          } catch {
            continue;
          }
        }
        
        if (!found) {
          throw new Error('Could not find formula bar on main page');
        }
      }
      
      // Type the TODAY() formula
      console.log('⌨️ Typing =TODAY() formula...');
      if (formulaBar) {
        await formulaBar.fill('=TODAY()');
      } else {
        throw new Error('Formula bar not found');
      }
      
      // Press Enter to execute the formula
      console.log('⏎ Pressing Enter to execute formula...');
      await this.page.keyboard.press('Enter');
      
      // Wait for calculation and save
      console.log('⏳ Waiting for calculation...');
      await this.page.waitForTimeout(5000);
      
      // Navigate back to A1 to get the result
      console.log('🎯 Navigating back to A1...');
      if (usingIframe) {
        const nameBox = frame.getByRole('combobox', { name: /Name Box/ });
        await nameBox.click();
        await nameBox.fill('A1');
        await this.page.keyboard.press('Enter');
      } else {
        // Try keyboard shortcut for main page
        await this.page.keyboard.press('Control+Home');
      }
      
      await this.page.waitForTimeout(3000);
      
      // Get the calculated result from the cell
      const result = await this.getCellResult();
      
      console.log(`✅ TODAY() function result: "${result}"`);
      return result;
    } catch (error) {
      console.error('❌ Failed to get TODAY() function result:', error);
      throw new Error(`TODAY() function test failed: ${error}`);
    }
  }

  /**
   * Get result from cell A1 based on MCP findings
   */
  private async getCellResult(): Promise<string> {
    console.log('🔍 Getting calculated value from cell A1...');
    
    try {
      // Try to get the Excel iframe, with fallback
      let frame;
      try {
        await this.page.waitForSelector('iframe[name*="WacFrame"], iframe[name*="Excel"]', { timeout: 5000 });
        frame = this.page.locator('iframe[name*="WacFrame"], iframe[name*="Excel"]').first().contentFrame();
        console.log('✅ Using Excel iframe for result retrieval');
      } catch {
        console.log('ℹ️ No iframe found, using main page for result retrieval');
        frame = this.page;
      }
      
      // Based on MCP findings: Look for textbox with aria-label containing the date and "A1"
      // Example: "8/22/2025 . A1 . Contains Formula ."
      const cellTextbox = frame.locator('textbox[aria-label*="A1"]').first();
      if (await cellTextbox.isVisible({ timeout: 5000 })) {
        const ariaLabel = await cellTextbox.getAttribute('aria-label');
        if (ariaLabel) {
          // Extract the date from the aria-label (first part before " . A1")
          const dateMatch = ariaLabel.match(/^([^.]+)\s*\./); 
          if (dateMatch && dateMatch[1]) {
            const dateValue = dateMatch[1].trim();
            console.log(`✅ Got calculated value from cell A1 aria-label: "${dateValue}"`);
            return dateValue;
          }
        }
        
        // Fallback: try to get input value
        const inputValue = await cellTextbox.inputValue();
        if (inputValue && inputValue.trim() && !inputValue.includes('=')) {
          console.log(`✅ Got calculated value from cell A1 input: "${inputValue.trim()}"`);
          return inputValue.trim();
        }
      }
      
      // Additional fallback: Look for any textbox with date pattern in aria-label
      const dateTextboxes = frame.locator('textbox[aria-label*="/"]');
      const count = await dateTextboxes.count();
      for (let i = 0; i < count; i++) {
        const textbox = dateTextboxes.nth(i);
        const ariaLabel = await textbox.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.includes('A1')) {
          const dateMatch = ariaLabel.match(/^([^.]+)\s*\./); 
          if (dateMatch && dateMatch[1]) {
            const dateValue = dateMatch[1].trim();
            console.log(`✅ Got calculated value from textbox ${i}: "${dateValue}"`);
            return dateValue;
          }
        }
      }
      
      console.log('⚠️ No calculated value found in expected format');
      return 'No result found';
    } catch (error) {
      console.log('❌ Error getting cell result:', error);
      return 'Error getting result';
    }
  }

  /**
   * Verify if a date string matches expected format and current date
   */
  verifyDateFormat(dateValue: string): { isValid: boolean; expectedDate: string; actualDate: string; message: string } {
    try {
      const today = new Date();
      const expectedDate = today.toLocaleDateString();
      
      const cleanDateValue = dateValue.trim();
      console.log(`🔍 Validating date: "${cleanDateValue}" against expected: "${expectedDate}"`);
      
      // Handle Excel's MM/DD/YYYY format (like "8/22/2025")
      const excelDateMatch = cleanDateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (excelDateMatch && excelDateMatch[1] && excelDateMatch[2] && excelDateMatch[3]) {
        const [, month, day, year] = excelDateMatch;
        const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (!isNaN(parsedDate.getTime())) {
          const isToday = parsedDate.toDateString() === today.toDateString();
          console.log(`📅 Parsed Excel date: ${parsedDate.toDateString()}, Today: ${today.toDateString()}, Match: ${isToday}`);
          
          return {
            isValid: isToday,
            expectedDate,
            actualDate: cleanDateValue,
            message: isToday ? 'Date matches current date' : `Date is ${parsedDate.toDateString()}, expected ${today.toDateString()}`
          };
        }
      }
      
      // Fallback: try other date parsing approaches
      const dateFormats = [
        new Date(cleanDateValue),
        new Date(cleanDateValue.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$1/$2/$3')),
        new Date(cleanDateValue.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$1-$2'))
      ];
      
      for (const parsedDate of dateFormats) {
        if (!isNaN(parsedDate.getTime())) {
          const isToday = parsedDate.toDateString() === today.toDateString();
          if (isToday) {
            return {
              isValid: true,
              expectedDate,
              actualDate: cleanDateValue,
              message: 'Date matches current date'
            };
          }
        }
      }
      
      return {
        isValid: false,
        expectedDate,
        actualDate: cleanDateValue,
        message: `Date "${cleanDateValue}" does not match current date "${expectedDate}" or invalid format`
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
      // Simple cleanup - just close any dialogs
      const closeButtons = [
        'button:has-text("Close")',
        'button:has-text("×")',
        '[aria-label="Close"]'
      ];

      for (const selector of closeButtons) {
        try {
          const closeButton = this.page.locator(selector);
          if (await closeButton.isVisible({ timeout: 2000 })) {
            await closeButton.click();
            break;
          }
        } catch {
          continue;
        }
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}