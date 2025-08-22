# Task 2 Guide: E2E Testing with Playwright

This guide covers end-to-end testing patterns and Playwright examples for automating Excel Online TODAY() function testing in Task 2.

## Overview

Task 2 demonstrates comprehensive E2E automation that:
- Automates Excel Online in Chrome browser
- Tests the TODAY() function functionality
- Verifies the returned date matches current system date
- Uses secure credential management
- Captures screenshots and videos for debugging

## Project Structure

```
e2e-automation/
├── tests/
│   ├── excel-online/
│   │   └── today-function.spec.ts    # Main E2E test
│   ├── helpers/
│   │   └── excel-page.ts             # Page Object Model
│   └── fixtures/
│       └── test-data.json            # Test data
├── config/
│   ├── test-config.json              # Test configuration
│   └── test-config.example.json      # Configuration template
├── playwright.config.ts              # Playwright configuration
├── package.json                      # Dependencies and scripts
└── test-results/                     # Generated test artifacts
```

## Playwright Configuration

The Playwright configuration (`playwright.config.ts`) includes:

```typescript
import { defineConfig, devices } from '@playwright/test';
import testConfig from './config/test-config.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: testConfig.excel.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: testConfig.browser.viewport,
        launchOptions: {
          slowMo: testConfig.browser.slowMo,
        },
      },
    },
  ],

  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Page Object Model Pattern

### Excel Online Page Object

```typescript
// tests/helpers/excel-page.ts
import { Page, Locator, expect } from '@playwright/test';
import testConfig from '../../config/test-config.json';

export class ExcelOnlinePage {
  readonly page: Page;
  readonly signInButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly nextButton: Locator;
  readonly signInSubmitButton: Locator;
  readonly newWorkbookButton: Locator;
  readonly formulaBar: Locator;
  readonly cellA1: Locator;

  constructor(page: Page) {
    this.page = page;
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.emailInput = page.getByPlaceholder('Email, phone, or Skype');
    this.passwordInput = page.getByPlaceholder('Password');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.signInSubmitButton = page.getByRole('button', { name: 'Sign in' });
    this.newWorkbookButton = page.getByText('New blank workbook');
    this.formulaBar = page.locator('[data-automation-id="formulabar-input"]');
    this.cellA1 = page.locator('[data-automation-id="cell-A1"]');
  }

  async navigateToExcel(): Promise<void> {
    await this.page.goto(testConfig.excel.baseUrl);
    await this.page.waitForLoadState('networkidle');
  }

  async login(): Promise<void> {
    const { username, password } = testConfig.excel.credentials;
    
    // Click sign in
    await this.signInButton.click();
    
    // Enter email
    await this.emailInput.fill(username);
    await this.nextButton.click();
    
    // Enter password
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.passwordInput.fill(password);
    await this.signInSubmitButton.click();
    
    // Wait for redirect to Excel Online
    await this.page.waitForURL('**/excel**', { 
      timeout: testConfig.excel.timeouts.navigation 
    });
  }

  async createNewWorkbook(): Promise<void> {
    await this.newWorkbookButton.click();
    await this.page.waitForLoadState('networkidle');
    
    // Wait for Excel interface to load
    await this.formulaBar.waitFor({ 
      state: 'visible',
      timeout: testConfig.excel.timeouts.element 
    });
  }

  async selectCell(cellAddress: string): Promise<void> {
    const cell = this.page.locator(`[data-automation-id="cell-${cellAddress}"]`);
    await cell.click();
    await cell.waitFor({ state: 'focused' });
  }

  async enterFormula(formula: string): Promise<void> {
    await this.formulaBar.click();
    await this.formulaBar.fill(formula);
    await this.page.keyboard.press('Enter');
    
    // Wait for formula to execute
    await this.page.waitForTimeout(1000);
  }

  async getCellValue(cellAddress: string): Promise<string> {
    const cell = this.page.locator(`[data-automation-id="cell-${cellAddress}"]`);
    await cell.waitFor({ state: 'visible' });
    
    const value = await cell.textContent();
    return value?.trim() || '';
  }

  async getTodayFunctionResult(): Promise<string> {
    return await this.getCellValue('A1');
  }

  verifyDateFormat(dateValue: string): boolean {
    // Common Excel date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
    const dateFormats = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,  // MM/DD/YYYY or DD/MM/YYYY
      /^\d{4}-\d{2}-\d{2}$/,        // YYYY-MM-DD
      /^\d{1,2}-\d{1,2}-\d{4}$/,    // MM-DD-YYYY or DD-MM-YYYY
    ];
    
    return dateFormats.some(format => format.test(dateValue));
  }

  async cleanup(): Promise<void> {
    // Close any open dialogs
    await this.page.keyboard.press('Escape');
    
    // Navigate away or close workbook if needed
    await this.page.goto('about:blank');
  }
}
```

## Test Implementation Patterns

### 1. Basic Test Structure

```typescript
// tests/excel-online/today-function.spec.ts
import { test, expect } from '@playwright/test';
import { ExcelOnlinePage } from '../helpers/excel-page';

test.describe('Excel Online TODAY() Function', () => {
  let excelPage: ExcelOnlinePage;

  test.beforeEach(async ({ page }) => {
    excelPage = new ExcelOnlinePage(page);
  });

  test.afterEach(async () => {
    await excelPage.cleanup();
  });

  test('should return current date when TODAY() function is used', async () => {
    // Test implementation
  });
});
```

### 2. Complete TODAY() Function Test

```typescript
test('should return current date when TODAY() function is used', async ({ page }) => {
  const excelPage = new ExcelOnlinePage(page);
  
  // Step 1: Navigate to Excel Online
  await test.step('Navigate to Excel Online', async () => {
    await excelPage.navigateToExcel();
  });

  // Step 2: Login with credentials
  await test.step('Login to Excel Online', async () => {
    await excelPage.login();
  });

  // Step 3: Create new workbook
  await test.step('Create new workbook', async () => {
    await excelPage.createNewWorkbook();
  });

  // Step 4: Enter TODAY() function
  await test.step('Enter TODAY() function in cell A1', async () => {
    await excelPage.selectCell('A1');
    await excelPage.enterFormula('=TODAY()');
  });

  // Step 5: Verify result
  await test.step('Verify TODAY() function returns current date', async () => {
    const cellValue = await excelPage.getTodayFunctionResult();
    
    // Verify date format
    expect(excelPage.verifyDateFormat(cellValue)).toBe(true);
    
    // Verify date is today
    const today = new Date();
    const expectedDate = today.toLocaleDateString();
    
    // Parse the cell value and compare dates
    const cellDate = new Date(cellValue);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const cellDateNormalized = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
    
    expect(cellDateNormalized.getTime()).toBe(todayDate.getTime());
  });

  // Step 6: Take screenshot for documentation
  await test.step('Capture screenshot', async () => {
    await page.screenshot({ 
      path: 'test-results/today-function-success.png',
      fullPage: true 
    });
  });
});
```

### 3. Error Handling and Retry Logic

```typescript
test('should handle network timeouts gracefully', async ({ page }) => {
  const excelPage = new ExcelOnlinePage(page);
  
  // Set custom timeout for this test
  test.setTimeout(120000);
  
  await test.step('Navigate with retry logic', async () => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        await excelPage.navigateToExcel();
        break;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) throw error;
        
        console.log(`Attempt ${attempts} failed, retrying...`);
        await page.waitForTimeout(2000);
      }
    }
  });
});
```

### 4. Data-Driven Testing

```typescript
// tests/fixtures/test-data.json
{
  "formulaTests": [
    {
      "formula": "=TODAY()",
      "expectedType": "date",
      "description": "TODAY function returns current date"
    },
    {
      "formula": "=NOW()",
      "expectedType": "datetime",
      "description": "NOW function returns current date and time"
    }
  ]
}

// In test file
import testData from '../fixtures/test-data.json';

testData.formulaTests.forEach(({ formula, expectedType, description }) => {
  test(`should handle ${formula} correctly`, async ({ page }) => {
    // Test implementation using formula and expectedType
  });
});
```

## Advanced Testing Patterns

### 1. Custom Fixtures

```typescript
// tests/fixtures/excel-fixture.ts
import { test as base } from '@playwright/test';
import { ExcelOnlinePage } from '../helpers/excel-page';

type ExcelFixtures = {
  excelPage: ExcelOnlinePage;
  authenticatedPage: ExcelOnlinePage;
};

export const test = base.extend<ExcelFixtures>({
  excelPage: async ({ page }, use) => {
    const excelPage = new ExcelOnlinePage(page);
    await use(excelPage);
    await excelPage.cleanup();
  },

  authenticatedPage: async ({ page }, use) => {
    const excelPage = new ExcelOnlinePage(page);
    await excelPage.navigateToExcel();
    await excelPage.login();
    await use(excelPage);
    await excelPage.cleanup();
  },
});
```

### 2. Visual Testing

```typescript
test('should match Excel interface screenshot', async ({ page }) => {
  const excelPage = new ExcelOnlinePage(page);
  
  await excelPage.navigateToExcel();
  await excelPage.login();
  await excelPage.createNewWorkbook();
  
  // Visual comparison
  await expect(page).toHaveScreenshot('excel-interface.png');
});
```

### 3. API Integration Testing

```typescript
test('should verify Excel Online API responses', async ({ page, request }) => {
  // Intercept API calls
  await page.route('**/api/excel/**', async route => {
    const response = await route.fetch();
    const json = await response.json();
    
    // Verify API response structure
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveProperty('cells');
    
    await route.continue();
  });
  
  // Continue with test
  const excelPage = new ExcelOnlinePage(page);
  await excelPage.navigateToExcel();
});
```

## Running E2E Tests

### Basic Test Execution

```bash
# Run all E2E tests
npm test

# Run tests in headed mode (visible browser)
npm test -- --headed

# Run specific test file
npm test -- today-function.spec.ts

# Run tests with debug mode
npm test -- --debug
```

### Advanced Test Options

```bash
# Run tests in specific browser
npm test -- --project=chromium

# Run tests with custom timeout
npm test -- --timeout=60000

# Run tests with trace enabled
npm test -- --trace=on

# Generate HTML report
npm test -- --reporter=html
```

## Configuration Management

### Environment-Specific Configurations

```typescript
// config/environments/dev.json
{
  "excel": {
    "baseUrl": "https://www.office.com/launch/excel",
    "credentials": {
      "username": "dev-user@example.com",
      "password": "dev-password"
    }
  }
}

// config/environments/ci.json
{
  "excel": {
    "baseUrl": "https://www.office.com/launch/excel",
    "credentials": {
      "username": "${EXCEL_USERNAME}",
      "password": "${EXCEL_PASSWORD}"
    }
  },
  "browser": {
    "headless": true
  }
}
```

### Loading Configuration

```typescript
// helpers/config-loader.ts
import fs from 'fs';
import path from 'path';

export function loadConfig(environment: string = 'dev') {
  const configPath = path.join(__dirname, `../config/environments/${environment}.json`);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Replace environment variables
  return JSON.parse(JSON.stringify(config).replace(/\$\{(\w+)\}/g, (_, key) => {
    return process.env[key] || '';
  }));
}
```

## Debugging and Troubleshooting

### 1. Debug Mode

```bash
# Run tests in debug mode
npm test -- --debug

# Run with browser developer tools
npm test -- --headed --debug
```

### 2. Trace Viewer

```bash
# Generate trace files
npm test -- --trace=on

# View trace in browser
npx playwright show-trace test-results/trace.zip
```

### 3. Screenshots and Videos

```typescript
// Capture screenshot at any point
await page.screenshot({ path: 'debug-screenshot.png' });

// Start video recording
const context = await browser.newContext({
  recordVideo: { dir: 'videos/' }
});
```

## Best Practices

### 1. Page Object Model

- Encapsulate page interactions in page objects
- Use descriptive locator strategies
- Implement reusable methods
- Handle waits and timeouts properly

### 2. Test Organization

```typescript
test.describe('Feature Group', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
  });

  test.describe('Specific Scenario', () => {
    // Related tests
  });
});
```

### 3. Reliable Selectors

```typescript
// Good: Use data attributes
page.locator('[data-automation-id="cell-A1"]')

// Good: Use role-based selectors
page.getByRole('button', { name: 'Sign in' })

// Avoid: CSS selectors that might change
page.locator('.ms-Button-label')
```

### 4. Error Handling

```typescript
try {
  await page.waitForSelector('.loading', { state: 'hidden', timeout: 5000 });
} catch (error) {
  console.log('Loading indicator not found, continuing...');
}
```

## Integration with CI/CD

```yaml
# .github/workflows/task2-ci.yml
- name: Run E2E Tests
  run: |
    cd e2e-automation
    npx playwright install chromium
    npm test
  env:
    EXCEL_USERNAME: ${{ secrets.EXCEL_USERNAME }}
    EXCEL_PASSWORD: ${{ secrets.EXCEL_PASSWORD }}
```

## Security Considerations

### 1. Credential Management

- Never commit credentials to version control
- Use environment variables in CI/CD
- Store credentials securely in configuration files
- Use `.gitignore` to exclude sensitive files

### 2. Test Data Cleanup

```typescript
test.afterEach(async ({ page }) => {
  // Clear browser data
  await page.context().clearCookies();
  await page.context().clearPermissions();
});
```

## Next Steps

1. Set up Excel Online credentials in configuration
2. Implement the page object model for Excel interactions
3. Write comprehensive E2E tests for TODAY() function
4. Run tests locally to verify functionality
5. Set up CI/CD integration for automated testing
6. Review the [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues