# TypeScript Testing Framework

A comprehensive testing framework that demonstrates both unit testing with Jest and end-to-end automation for Excel Online using Playwright. This project showcases modern TypeScript development practices with proper tooling configuration.

## Project Overview

This framework consists of two main testing components:

- **Task 1**: Unit testing framework using Jest for testing a string increment function
- **Task 2**: End-to-end automation framework using Playwright for Excel Online TODAY() function testing

## Features

- 🧪 **Unit Testing**: Jest with TypeScript support and comprehensive coverage reporting
- 🎭 **E2E Testing**: Playwright automation for Excel Online functionality
- 📝 **TypeScript**: Strict type checking and modern language features
- 🔧 **Code Quality**: ESLint, Prettier, and Husky for consistent code standards
- 📊 **CI/CD**: GitHub Actions workflows for automated testing
- 📚 **Documentation**: Comprehensive guides and troubleshooting resources

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd typescript-testing-framework
   npm install
   ```

2. **Run Unit Tests (Task 1)**
   ```bash
   cd task1-test-cases
   npm install
   npm test
   ```

3. **Run E2E Tests (Task 2)**
   ```bash
   cd e2e-automation
   npm install
   npx playwright install chromium
   npm test
   ```

## Project Structure

```
typescript-testing-framework/
├── task1-test-cases/           # Unit testing with Jest
│   ├── src/simple-function.ts  # String increment function
│   └── tests/                  # Jest unit tests
├── e2e-automation/            # E2E automation with Playwright
│   ├── tests/excel-online/    # Excel Online test scenarios
│   └── config/                # Test configuration
├── config/                    # Shared TypeScript/ESLint/Prettier config
├── docs/                      # Comprehensive documentation
└── .github/workflows/         # CI/CD pipelines
```

## Documentation

- 📋 **[Setup Guide](docs/SETUP.md)** - Step-by-step installation and configuration
- 🧪 **[Task 1 Guide](docs/TASK1_GUIDE.md)** - Unit testing patterns and Jest examples
- 🎭 **[Task 2 Guide](docs/TASK2_GUIDE.md)** - E2E testing patterns and Playwright examples
- 🔧 **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Requirements Covered

This framework addresses comprehensive testing requirements including:

- **Unit Testing**: String increment function with 90% code coverage
- **E2E Testing**: Excel Online TODAY() function automation in Chrome
- **Code Quality**: TypeScript, ESLint, Prettier, and pre-commit hooks
- **Documentation**: Complete setup guides and usage examples
- **CI/CD**: Automated testing workflows
- **Extensibility**: Modular design for adding new test types

## Technology Stack

- **Testing**: Jest (unit), Playwright (E2E)
- **Language**: TypeScript with strict configuration
- **Code Quality**: ESLint + Prettier + Husky
- **CI/CD**: GitHub Actions
- **Browser**: Chrome (primary), with multi-browser support

## Getting Help

- Check the [Setup Guide](docs/SETUP.md) for installation issues
- Review [Troubleshooting](docs/TROUBLESHOOTING.md) for common problems
- Examine the task-specific guides for detailed usage patterns

## Contributing

1. Follow the existing code style (enforced by ESLint/Prettier)
2. Ensure all tests pass before submitting changes
3. Add tests for new functionality
4. Update documentation as needed

## License

This project is for educational and demonstration purposes.