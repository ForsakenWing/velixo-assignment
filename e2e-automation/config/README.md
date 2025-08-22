# Configuration Setup

## Creating Your Test Configuration

1. Copy `test-config.template.json` to `test-config.json`
2. Update the credentials with your Microsoft account details
3. Adjust timeouts and browser settings as needed

```bash
cp test-config.template.json test-config.json
```

## Configuration File Structure

```json
{
  "excel": {
    "baseUrl": "https://www.office.com",
    "credentials": {
      "username": "your-email@example.com",
      "password": "your-password"
    },
    "timeouts": {
      "navigation": 60000,
      "element": 30000,
      "test": 120000
    }
  },
  "browser": {
    "headless": false,
    "viewport": {
      "width": 1280,
      "height": 720
    },
    "slowMo": 100
  }
}
```

## Environment Variable Overrides

You can override configuration values using environment variables:

- `EXCEL_USERNAME` - Override Excel username
- `EXCEL_PASSWORD` - Override Excel password
- `HEADLESS` - Set to 'true' for headless browser mode
- `SLOW_MO` - Slow down operations by specified milliseconds
- `TEST_TIMEOUT` - Override test timeout in milliseconds

## Security Notes

- **Never commit `test-config.json` to version control**
- The file is already added to `.gitignore`
- Use environment variables in CI/CD environments
- Consider using a password manager or secure vault for credentials

## CI/CD Setup

For continuous integration, set these environment variables:

```bash
export EXCEL_USERNAME="your-test-account@example.com"
export EXCEL_PASSWORD="your-secure-password"
export HEADLESS="true"
```

## Troubleshooting

- If authentication fails, verify your Microsoft account credentials
- For 2FA accounts, you may need an app-specific password
- Ensure your account has access to Excel Online
- Check network connectivity to office.com