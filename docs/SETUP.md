# Setup Guide

This guide provides step-by-step instructions for setting up the TypeScript Testing Framework on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Git** (for version control)
- **Chrome browser** (for E2E testing)

### Verify Prerequisites

```bash
node --version    # Should be 18.0.0 or higher
npm --version     # Should be 8.0.0 or higher
git --version     # Any recent version
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd typescript-testing-framework
```

### 2. Install Root Dependencies

Install shared development tools and configuration:

```bash
npm install
```

This installs:
- TypeScript compiler
- ESLint and Prettier for code quality
- Husky for pre-commit hooks
- Shared configuration files

### 3. Set Up Task 1 (Unit Testing)

Navigate to the unit testing directory and install dependencies:

```bash
cd task1-test-cases
npm install
```

This installs:
- Jest testing framework
- TypeScript support for Jest
- Coverage reporting tools

### 4. Set Up Task 2 (E2E Testing)

Navigate to the E2E testing directory and install dependencies:

```bash
cd ../e2e-automation
npm install
```

Install Playwright browsers:

```bash
npx playwright install chromium
```

This installs:
- Playwright testing framework
- Chrome browser for automation
- TypeScript support for Playwright

### 5. Configure Environment

#### For Task 2 (E2E Testing)

Create a configuration file for Excel Online credentials:

```bash
# In e2e-automation directory
cp config/test-config.example.json config/test-config.json
```

Edit `config/test-config.json` with your Excel Online credentials:

```json
{
  "excel": {
    "baseUrl": "https://www.office.com/launch/excel",
    "credentials": {
      "username": "your-email@example.com",
      "password": "your-password"
    },
    "timeouts": {
      "navigation": 30000,
      "element": 10000,
      "test": 60000
    }
  },
  "browser": {
    "headless": false,
    "viewport": { "width": 1280, "height": 720 },
    "slowMo": 100
  }
}
```

**Important**: Never commit this file to version control. It's already included in `.gitignore`.

## Verification

### Verify Task 1 Setup

```bash
cd task1-test-cases
npm test
```

Expected output:
```
PASS tests/simple-function.test.ts
✓ String increment function tests
Test Suites: 1 passed, 1 total
Tests: X passed, X total
Coverage: 90%+ statements, branches, functions, lines
```

### Verify Task 2 Setup

```bash
cd e2e-automation
npm test
```

Expected output:
```
Running 1 test using 1 worker
✓ Excel Online TODAY() function test
1 passed (Xs)
```

## IDE Configuration

### VS Code Setup

Install recommended extensions:

```bash
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension ms-playwright.playwright
```

Configure VS Code settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.validate": ["typescript", "javascript"]
}
```

## Environment Variables

For CI/CD and different environments, you can use environment variables:

```bash
# For Task 2 E2E testing
export EXCEL_USERNAME="your-email@example.com"
export EXCEL_PASSWORD="your-password"
export HEADLESS_MODE="true"
```

## Troubleshooting Setup Issues

### Common Issues

1. **Node.js version too old**
   ```bash
   # Update Node.js using nvm (recommended)
   nvm install 18
   nvm use 18
   ```

2. **Playwright browser installation fails**
   ```bash
   # Try installing with specific browser
   npx playwright install chromium --force
   ```

3. **Permission errors on macOS/Linux**
   ```bash
   # Fix npm permissions
   sudo chown -R $(whoami) ~/.npm
   ```

4. **Husky hooks not working**
   ```bash
   # Reinstall Husky hooks
   npx husky install
   ```

### Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review the task-specific guides:
   - [Task 1 Guide](TASK1_GUIDE.md)
   - [Task 2 Guide](TASK2_GUIDE.md)
3. Verify all prerequisites are correctly installed
4. Ensure you're using the correct Node.js version

## Next Steps

After successful setup:

1. Read the [Task 1 Guide](TASK1_GUIDE.md) to understand unit testing patterns
2. Read the [Task 2 Guide](TASK2_GUIDE.md) to understand E2E testing patterns
3. Run the tests to ensure everything works correctly
4. Start exploring the codebase and documentation