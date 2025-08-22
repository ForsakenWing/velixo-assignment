# Task 1 Guide: Unit Testing with Jest

This guide covers unit testing patterns and Jest examples for testing the string increment function in Task 1.

## Overview

Task 1 demonstrates comprehensive unit testing of a string increment function that:
- Takes strings in format `A...A1...1` (1-4 letters + 1-4 digits)
- Increments the numeric postfix by 1
- Handles overflow by resetting to zeros
- Returns "Error" for invalid inputs

## Project Structure

```
task1-test-cases/
├── src/
│   └── simple-function.ts      # Function implementation
├── tests/
│   └── simple-function.test.ts # Jest test suite
├── jest.config.ts              # Jest configuration
├── package.json                # Dependencies and scripts
└── coverage/                   # Generated coverage reports
```

## Function Specification

### Valid Input Format
- **Letters**: 1-4 letters (A-Z, case insensitive)
- **Digits**: 1-4 digits (0-9)
- **Format**: `[A-Za-z]{1,4}[0-9]{1,4}`

### Examples
```typescript
stringIncrement("FX001")  // → "FX002"
stringIncrement("A9")     // → "A10"
stringIncrement("ZZ100")  // → "ZZ101"
stringIncrement("A9999")  // → "A0000" (overflow)
stringIncrement("invalid") // → "Error"
```

## Jest Configuration

The Jest configuration (`jest.config.ts`) includes:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

export default config;
```

## Test Patterns and Examples

### 1. Basic Test Structure

```typescript
import { stringIncrement } from '../src/simple-function';

describe('stringIncrement', () => {
  describe('when given valid input', () => {
    it('should increment single digit', () => {
      expect(stringIncrement('A1')).toBe('A2');
    });
  });

  describe('when given invalid input', () => {
    it('should return Error for invalid format', () => {
      expect(stringIncrement('invalid')).toBe('Error');
    });
  });
});
```

### 2. Parameterized Tests

```typescript
describe('valid input increments', () => {
  test.each([
    ['A1', 'A2'],
    ['FX001', 'FX002'],
    ['ZZ100', 'ZZ101'],
    ['ABCD1234', 'ABCD1235'],
  ])('stringIncrement(%s) should return %s', (input, expected) => {
    expect(stringIncrement(input)).toBe(expected);
  });
});
```

### 3. Edge Cases and Overflow Testing

```typescript
describe('overflow scenarios', () => {
  test.each([
    ['A9', 'A10'],
    ['A99', 'A100'],
    ['A999', 'A1000'],
    ['A9999', 'A0000'],  // Overflow resets to zeros
    ['ZZ9999', 'ZZ0000'], // Multiple letters with overflow
  ])('stringIncrement(%s) should handle overflow correctly', (input, expected) => {
    expect(stringIncrement(input)).toBe(expected);
  });
});
```

### 4. Invalid Input Testing

```typescript
describe('invalid input handling', () => {
  test.each([
    [''],           // Empty string
    ['A'],          // No digits
    ['123'],        // No letters
    ['ABCDE1'],     // Too many letters
    ['A12345'],     // Too many digits
    ['A1B2'],       // Mixed format
    ['A-1'],        // Special characters
    ['A 1'],        // Spaces
  ])('stringIncrement(%s) should return Error', (input) => {
    expect(stringIncrement(input)).toBe('Error');
  });
});
```

### 5. Case Insensitivity Testing

```typescript
describe('case insensitivity', () => {
  test.each([
    ['a1', 'A2'],
    ['fx001', 'FX002'],
    ['Zz100', 'ZZ101'],
  ])('stringIncrement(%s) should handle case insensitively', (input, expected) => {
    expect(stringIncrement(input)).toBe(expected);
  });
});
```

### 6. Custom Matchers

```typescript
// Custom matcher for string format validation
expect.extend({
  toMatchStringFormat(received: string) {
    const pattern = /^[A-Z]{1,4}[0-9]{1,4}$/;
    const pass = pattern.test(received);
    
    return {
      message: () => 
        `expected ${received} ${pass ? 'not ' : ''}to match format A...A1...1`,
      pass,
    };
  },
});

// Usage
it('should return properly formatted string', () => {
  const result = stringIncrement('A1');
  expect(result).toMatchStringFormat();
});
```

## Running Tests

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Advanced Test Options

```bash
# Run specific test file
npm test -- simple-function.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="overflow"

# Run tests with verbose output
npm test -- --verbose

# Update snapshots (if using snapshot testing)
npm test -- --updateSnapshot
```

## Coverage Requirements

The project enforces 90% coverage across all metrics:

- **Statements**: 90%
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%

### Viewing Coverage Reports

```bash
# Generate and view HTML coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

## Best Practices

### 1. Test Organization

```typescript
describe('FunctionName', () => {
  // Group related tests
  describe('when condition A', () => {
    it('should do X', () => {
      // Test implementation
    });
  });
  
  describe('when condition B', () => {
    it('should do Y', () => {
      // Test implementation
    });
  });
});
```

### 2. Clear Test Names

```typescript
// Good: Descriptive and specific
it('should increment numeric postfix by 1 for valid input', () => {});

// Bad: Vague and unclear
it('should work', () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should increment single digit correctly', () => {
  // Arrange
  const input = 'A1';
  const expected = 'A2';
  
  // Act
  const result = stringIncrement(input);
  
  // Assert
  expect(result).toBe(expected);
});
```

### 4. Test Data Management

```typescript
// Use constants for test data
const VALID_INPUTS = [
  { input: 'A1', expected: 'A2' },
  { input: 'FX001', expected: 'FX002' },
];

const INVALID_INPUTS = ['', 'A', '123', 'ABCDE1'];
```

## Debugging Tests

### 1. Using Console Logs

```typescript
it('should debug test execution', () => {
  const input = 'A1';
  console.log('Input:', input);
  
  const result = stringIncrement(input);
  console.log('Result:', result);
  
  expect(result).toBe('A2');
});
```

### 2. Using Jest Debugger

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 3. Isolating Tests

```typescript
// Run only this test
it.only('should run only this test', () => {
  // Test implementation
});

// Skip this test
it.skip('should skip this test', () => {
  // Test implementation
});
```

## Common Issues and Solutions

### 1. TypeScript Compilation Errors

```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix import/export issues
import { stringIncrement } from '../src/simple-function';
```

### 2. Coverage Not Meeting Threshold

```typescript
// Ensure all code paths are tested
if (condition) {
  // Test this branch
} else {
  // And this branch too
}
```

### 3. Async Testing (if needed)

```typescript
// For async functions
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```

## Integration with CI/CD

The tests integrate with GitHub Actions for continuous integration:

```yaml
# .github/workflows/task1-ci.yml
- name: Run Unit Tests
  run: |
    cd task1-test-cases
    npm test -- --coverage --watchAll=false
```

## Next Steps

1. Implement the string increment function in `src/simple-function.ts`
2. Write comprehensive tests following the patterns above
3. Ensure 90% code coverage is achieved
4. Run tests locally before committing
5. Review the [Task 2 Guide](TASK2_GUIDE.md) for E2E testing patterns