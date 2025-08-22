# Excel Online E2E Testing Framework

This framework provides end-to-end testing for Excel Online's TODAY() function using Playwright and TypeScript.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Real Microsoft Account** with Excel Online access
3. **Chrome Browser** (will be installed by Playwright)

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

### Configuration

1. **Copy the configuration template:**
   ```bash
   cp config/test-config.template.json config/test-config.json
   ```

2. **Update credentials in `config/test-config.json`:**
   ```json
   {
     "excel": {
       "credentials": {
         "username": "your-real-email@outlook.com",
         "password": "your-real-password"
       }
     }
   }
   ```

   ⚠️ **IMPORTANT:** 
   - Use a **real Microsoft account** (Outlook, Hotmail, or Office 365)
   - Template credentials will **NOT** work
   - Never commit real credentials to version control

### Running Tests

```bash
# Run all tests
npm test

# Run only smoke tests (no authentication required)
npm run test:smoke

# Run TODAY() function tests specifically
npx playwright test today-function.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with debug mode
npx playwright test --debug
```

## 🧪 Test Structure

### Test Files

- **`smoke-test.spec.ts`** - Basic environment and configuration validation
- **`today-function.spec.ts`** - Complete TODAY() function testing suite

### Test Scenarios

1. **Basic TODAY() Function Test**
   - Authenticates with Excel Online
   - Creates new workbook
   - Enters `=TODAY()` formula
   - Validates result matches current date

2. **Date Format Validation**
   - Tests multiple iterations for consistency
   - Validates different date format handling

3. **Timezone Considerations**
   - Tests date handling across different formats
   - Validates system date comparison

4. **Screenshot Capture**
   - Demonstrates failure debugging capabilities
   - Captures screenshots on success/failure

5. **Cleanup Verification**
   - Tests proper workbook cleanup
   - Validates browser session management

## 🔧 Architecture

### Key Components

- **`ExcelOnlinePage`** - Page Object Model for Excel Online interactions
- **`TestUtils`** - Centralized test utilities and operations
- **`DateUtils`** - Date validation and parsing utilities
- **`BrowserUtils`** - Browser management and screenshot utilities
- **`ConfigLoader`** - Configuration management with environment support

### Authentication Flow

The framework handles Microsoft's complex authentication flow:

1. Navigate to Excel Online → Redirect to Microsoft login
2. Enter email address → Handle account type selection
3. Choose authentication method → Enter password
4. Handle "Stay signed in" prompt → Redirect to Excel Online
5. Create workbook → Ready for testing

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Failures
```
❌ Authentication failed: Login failed: Could not find email input field
```

**Solutions:**
- Verify you're using real Microsoft credentials
- Check if Microsoft has updated their login page structure
- Try running in headed mode to see what's happening: `--headed`

#### Workbook Creation Failures
```
❌ Failed to create new workbook: Could not find any option to create a new workbook
```

**Solutions:**
- Ensure authentication completed successfully
- Check if you have Excel Online access with your account
- Try increasing timeouts in configuration

#### Cell Selection Issues
```
❌ Failed to select cell A1: Cell selection failed
```

**Solutions:**
- Wait for Excel interface to fully load
- Check if workbook creation was successful
- Verify Excel Online is accessible in your region

### Debug Mode

Run tests in debug mode to step through execution:

```bash
npx playwright test --debug today-function.spec.ts
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots: `test-results/screenshots/`
- Videos: `test-results/videos/`
- Traces: `test-results/traces/`

## 📊 Test Results

### Success Criteria

- ✅ Authentication completes successfully
- ✅ New workbook is created
- ✅ TODAY() formula is entered and calculated
- ✅ Result is a valid date matching current system date
- ✅ Screenshots are captured for documentation
- ✅ Cleanup removes test artifacts

### Expected Output

```
🧪 TEST STEP: Starting TODAY() function test
🔐 Starting authentication process...
📧 Entering email address...
🔐 Selecting password authentication...
🔒 Entering password...
✅ Authentication successful
📊 Creating new workbook...
✅ New workbook created: Test_Workbook_1703123456789
🎯 Selecting cell A1...
✅ Cell A1 selected via name box
📝 Entering formula: =TODAY()
✅ Formula entered via formula bar: =TODAY()
📖 Reading value from cell A1...
✅ Cell A1 value from formula bar: 12/21/2023
📊 TODAY() function returned: 12/21/2023
✅ TODAY() function test completed successfully
```

## 🔒 Security Notes

- **Never commit real credentials** to version control
- Use environment variables for CI/CD:
  ```bash
  export EXCEL_USERNAME="your-email@outlook.com"
  export EXCEL_PASSWORD="your-password"
  ```
- Consider using dedicated test accounts
- Regularly rotate test account passwords

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd e2e-automation
          npm install
          npx playwright install chromium
      
      - name: Run E2E tests
        env:
          EXCEL_USERNAME: ${{ secrets.EXCEL_USERNAME }}
          EXCEL_PASSWORD: ${{ secrets.EXCEL_PASSWORD }}
        run: |
          cd e2e-automation
          npm test
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: e2e-automation/test-results/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.