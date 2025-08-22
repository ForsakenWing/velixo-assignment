# Troubleshooting Guide

This guide covers common issues and solutions for the TypeScript Testing Framework.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Task 1 (Unit Testing) Issues](#task-1-unit-testing-issues)
- [Task 2 (E2E Testing) Issues](#task-2-e2e-testing-issues)
- [Configuration Issues](#configuration-issues)
- [CI/CD Issues](#cicd-issues)
- [Performance Issues](#performance-issues)
- [General Debugging](#general-debugging)

## Setup Issues

### Node.js Version Compatibility

**Problem**: Tests fail with Node.js version errors
```
Error: The engine "node" is incompatible with this module
```

**Solution**:
```bash
# Check current Node.js version
node --version

# Install Node.js 18 or higher using nvm
nvm install 18
nvm use 18

# Or update using your system package manager
# macOS with Homebrew:
brew install node@18

# Verify installation
node --version  # Should show 18.x.x or higher
```

### npm Installation Failures

**Problem**: Package installation fails with permission errors
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution**:
```bash
# Fix npm permissions (recommended approach)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Alternative: Use npx instead of global installs
npx create-react-app my-app
```

### TypeScript Configuration Issues

**Problem**: TypeScript compilation errors
```
Cannot find module '@types/node' or its corresponding type declarations
```

**Solution**:
```bash
# Install missing type definitions
npm install --save-dev @types/node @types/jest

# Verify TypeScript configuration
npx tsc --noEmit

# Check tsconfig.json extends the correct base config
{
  "extends": "../config/tsconfig.json"
}
```

## Task 1 (Unit Testing) Issues

### Jest Configuration Problems

**Problem**: Jest cannot find test files
```
No tests found, exiting with code 1
```

**Solution**:
```bash
# Verify test file naming convention
# Files should end with .test.ts or .spec.ts
mv simple-function.tests.ts simple-function.test.ts

# Check jest.config.ts testMatch pattern
testMatch: ['**/?(*.)+(spec|test).ts']

# Run with explicit pattern
npm test -- --testPathPattern=simple-function
```

### Coverage Threshold Failures

**Problem**: Tests pass but coverage is below 90%
```
Coverage threshold for statements (90%) not met: 85%
```

**Solution**:
```typescript
// Add tests for uncovered code paths
describe('edge cases', () => {
  it('should handle empty string input', () => {
    expect(stringIncrement('')).toBe('Error');
  });
  
  it('should handle null input', () => {
    expect(stringIncrement(null as any)).toBe('Error');
  });
});

// Check coverage report for specific uncovered lines
npm run test:coverage
open coverage/lcov-report/index.html
```

### TypeScript Import/Export Issues

**Problem**: Cannot import function from source file
```
Cannot find module '../src/simple-function' or its corresponding type declarations
```

**Solution**:
```typescript
// Ensure proper export in source file
// src/simple-function.ts
export function stringIncrement(input: string): string {
  // Implementation
}

// Ensure proper import in test file
// tests/simple-function.test.ts
import { stringIncrement } from '../src/simple-function';

// Check file extensions in imports (should not include .ts)
```

### Test Timeout Issues

**Problem**: Tests timeout unexpectedly
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Solution**:
```typescript
// Increase timeout for specific tests
it('should handle complex operations', async () => {
  // Test implementation
}, 10000); // 10 second timeout

// Or configure global timeout in jest.config.ts
module.exports = {
  testTimeout: 10000,
};
```

## Task 2 (E2E Testing) Issues

### Playwright Installation Problems

**Problem**: Playwright browsers not installed
```
browserType.launch: Executable doesn't exist at /path/to/chromium
```

**Solution**:
```bash
# Install Playwright browsers
npx playwright install

# Install specific browser
npx playwright install chromium

# Install with dependencies (Linux)
npx playwright install-deps chromium

# Verify installation
npx playwright --version
```

### Excel Online Authentication Issues

**Problem**: Login fails with valid credentials
```
TimeoutError: Timeout 30000ms exceeded
```

**Solutions**:

1. **Check credentials format**:
```json
{
  "excel": {
    "credentials": {
      "username": "user@domain.com",  // Full email address
      "password": "your-password"     // Exact password
    }
  }
}
```

2. **Handle two-factor authentication**:
```typescript
// Add 2FA handling if enabled
async login() {
  // ... existing login code ...
  
  // Check for 2FA prompt
  const twoFactorPrompt = page.locator('[data-automation-id="2fa-code"]');
  if (await twoFactorPrompt.isVisible({ timeout: 5000 })) {
    // Handle 2FA - may require manual intervention or app-specific password
    console.log('2FA required - please handle manually');
    await page.pause(); // Allows manual intervention
  }
}
```

3. **Use app-specific passwords**:
- Generate app-specific password in Microsoft account settings
- Use app password instead of regular password

### Element Not Found Errors

**Problem**: Cannot find Excel Online elements
```
TimeoutError: Locator.click: Timeout 30000ms exceeded
```

**Solutions**:

1. **Update selectors**:
```typescript
// Excel Online UI changes frequently, update selectors
// Check current DOM structure in browser dev tools
const formulaBar = page.locator('[data-automation-id="formulabar-input"]');
// Alternative selectors
const formulaBarAlt = page.locator('.ms-TextField-field[aria-label*="formula"]');
```

2. **Add proper waits**:
```typescript
// Wait for element to be visible and stable
await element.waitFor({ state: 'visible', timeout: 10000 });
await page.waitForLoadState('networkidle');

// Wait for Excel to fully load
await page.waitForFunction(() => {
  return window.Office && window.Office.context;
}, { timeout: 30000 });
```

### Browser Context Issues

**Problem**: Tests interfere with each other
```
Error: Page is closed
```

**Solution**:
```typescript
// Use proper test isolation
test.describe('Excel Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Fresh page for each test
    await page.goto('about:blank');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    await page.close();
  });
});

// Or use separate browser contexts
test('isolated test', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  // Test implementation
  await context.close();
});
```

### Network and Timeout Issues

**Problem**: Tests fail due to slow network
```
TimeoutError: Navigation timeout of 30000ms exceeded
```

**Solution**:
```typescript
// Increase timeouts in playwright.config.ts
export default defineConfig({
  use: {
    navigationTimeout: 60000,
    actionTimeout: 30000,
  },
  
  // Per-test timeout
  timeout: 120000,
});

// Handle slow networks
await page.goto(url, { 
  waitUntil: 'networkidle',
  timeout: 60000 
});
```

## Configuration Issues

### Environment Variable Problems

**Problem**: Configuration not loading environment variables
```
Error: EXCEL_USERNAME is not defined
```

**Solution**:
```bash
# Set environment variables
export EXCEL_USERNAME="user@example.com"
export EXCEL_PASSWORD="password"

# Or use .env file (install dotenv)
npm install --save-dev dotenv

# Create .env file
echo "EXCEL_USERNAME=user@example.com" > .env
echo "EXCEL_PASSWORD=password" >> .env

# Load in configuration
require('dotenv').config();
```

### Path Resolution Issues

**Problem**: Cannot resolve configuration files
```
Cannot find module './config/test-config.json'
```

**Solution**:
```typescript
// Use absolute paths
import path from 'path';
const configPath = path.join(__dirname, 'config', 'test-config.json');

// Or use proper relative paths
// From tests/excel-online/today-function.spec.ts
import config from '../../config/test-config.json';
```

## CI/CD Issues

### GitHub Actions Failures

**Problem**: Tests pass locally but fail in CI
```
Error: ENOENT: no such file or directory, open 'config/test-config.json'
```

**Solutions**:

1. **Environment-specific configuration**:
```yaml
# .github/workflows/task2-ci.yml
- name: Create test config
  run: |
    cd e2e-automation
    echo '{"excel":{"credentials":{"username":"${{ secrets.EXCEL_USERNAME }}","password":"${{ secrets.EXCEL_PASSWORD }}"}}}' > config/test-config.json
```

2. **Use environment variables directly**:
```typescript
// Load config from environment in CI
const config = process.env.CI ? {
  excel: {
    credentials: {
      username: process.env.EXCEL_USERNAME,
      password: process.env.EXCEL_PASSWORD,
    }
  }
} : require('./config/test-config.json');
```

### Browser Installation in CI

**Problem**: Browsers not available in CI environment
```
browserType.launch: Executable doesn't exist
```

**Solution**:
```yaml
# Add browser installation step
- name: Install Playwright Browsers
  run: |
    cd e2e-automation
    npx playwright install chromium
    npx playwright install-deps chromium
```

## Performance Issues

### Slow Test Execution

**Problem**: Tests take too long to run

**Solutions**:

1. **Optimize selectors**:
```typescript
// Use data attributes instead of complex CSS selectors
page.locator('[data-automation-id="cell-A1"]')  // Fast
page.locator('.ms-Grid-row:nth-child(1) .ms-Grid-col:nth-child(1)')  // Slow
```

2. **Reduce unnecessary waits**:
```typescript
// Remove arbitrary timeouts
// await page.waitForTimeout(5000);  // Bad

// Use specific waits
await page.waitForSelector('[data-automation-id="formulabar-input"]');  // Good
```

3. **Parallel execution**:
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 1 : 4,  // Parallel workers
  fullyParallel: true,
});
```

### Memory Issues

**Problem**: Tests consume too much memory
```
JavaScript heap out of memory
```

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or run with increased memory
node --max-old-space-size=4096 node_modules/.bin/jest
```

## General Debugging

### Enable Debug Logging

```bash
# Jest debug mode
DEBUG=* npm test

# Playwright debug mode
DEBUG=pw:api npm test

# Custom debug logging
DEBUG=myapp:* npm test
```

### Browser Developer Tools

```typescript
// Pause test execution for manual debugging
await page.pause();

// Open browser dev tools
await page.context().newPage();
```

### Screenshot Debugging

```typescript
// Take screenshots at key points
await page.screenshot({ 
  path: `debug-${Date.now()}.png`,
  fullPage: true 
});

// Automatic screenshots on failure (playwright.config.ts)
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

### Logging and Tracing

```typescript
// Add console logging
console.log('Current URL:', page.url());
console.log('Page title:', await page.title());

// Enable tracing
await page.context().tracing.start({ screenshots: true, snapshots: true });
// ... test steps ...
await page.context().tracing.stop({ path: 'trace.zip' });
```

## Getting Additional Help

### Check Logs and Reports

1. **Jest HTML Report**: `coverage/lcov-report/index.html`
2. **Playwright HTML Report**: `playwright-report/index.html`
3. **Test Results**: `test-results/` directory
4. **Browser Console**: Check for JavaScript errors

### Useful Commands for Diagnosis

```bash
# Check Node.js and npm versions
node --version && npm --version

# Verify TypeScript compilation
npx tsc --noEmit

# Check Jest configuration
npx jest --showConfig

# Verify Playwright installation
npx playwright --version
npx playwright show-report

# Run tests with maximum verbosity
npm test -- --verbose --no-coverage
```

### Community Resources

- **Jest Documentation**: https://jestjs.io/docs/troubleshooting
- **Playwright Documentation**: https://playwright.dev/docs/debug
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Stack Overflow**: Search for specific error messages

### When to Seek Help

If you've tried the solutions above and still encounter issues:

1. Check if the issue is reproducible in a clean environment
2. Gather relevant logs and error messages
3. Document the steps to reproduce the problem
4. Check the project's issue tracker or documentation
5. Consider reaching out to the development team with detailed information

Remember to include:
- Operating system and version
- Node.js and npm versions
- Exact error messages
- Steps to reproduce
- Any recent changes to the codebase