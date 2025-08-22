import { stringIncrement } from '../src/simple-function';

/**
 * Test data for data-driven testing
 *
 * Data-driven testing separates test logic from test data:
 * - Test data is clearly defined here in one place
 * - Easy to add new test cases by adding entries to these arrays
 * - Easy to modify expected results by changing the data
 * - Same test logic runs for all data entries
 */
const validTestCases = [
  // Boundary conditions (minimum and maximum valid formats)
  {
    input: 'A1',
    expected: 'A2',
    description: 'minimum valid format (1 letter, 1 digit)',
  },
  {
    input: 'ABCD1234',
    expected: 'ABCD1235',
    description: 'maximum valid format (4 letters, 4 digits)',
  },

  // Basic increment cases (one per format combination)
  {
    input: 'F001',
    expected: 'F002',
    description: 'single letter, multiple digits with leading zeros',
  },
  {
    input: 'XYZ5',
    expected: 'XYZ6',
    description: 'multiple letters, single digit',
  },
  {
    input: 'FX001',
    expected: 'FX002',
    description: 'multiple letters, multiple digits',
  },

  // Case preservation
  {
    input: 'fx001',
    expected: 'fx002',
    description: 'case preservation - lowercase',
  },
  {
    input: 'FxYz123',
    expected: 'FxYz124',
    description: 'case preservation - mixed case',
  },

  // Digit expansion (when incrementing increases digit count)
  {
    input: 'A9',
    expected: 'A10',
    description: 'digit expansion - 1 to 2 digits',
  },
  {
    input: 'A99',
    expected: 'A100',
    description: 'digit expansion - 2 to 3 digits',
  },
  {
    input: 'A999',
    expected: 'A1000',
    description: 'digit expansion - 3 to 4 digits',
  },

  // Leading zeros preservation
  {
    input: 'A009',
    expected: 'A010',
    description: 'leading zeros preservation',
  },
  // lol, this one is overcomplication for me, I tried running > parseInt(010, 10) in console and appeared 8 because of
  // binary numbers representation and thought that I missed some test-case and totally forgot that I am parsing numbers from strings
  // so I would never encounter it, thats how deep simple function test can go :DD
  {
    input: 'A010',
    expected: 'A011',
    description: '010 interpreted as 10, not as 8, because its not binary',
  },

  // Overflow cases (when incrementing would exceed 4 digits, reset to zeros)
  {
    input: 'A9999',
    expected: 'A0000',
    description: 'overflow - single letter',
  },
  {
    input: 'ZZ9999',
    expected: 'ZZ0000',
    description: 'overflow - multiple letters',
  },
];

const invalidTestCases = [
  // Format violations
  { input: '123', description: 'no letters - digits only' },
  { input: 'ABC', description: 'no digits - letters only' },

  // Boundary violations
  { input: 'ABCDE1', description: 'too many letters (5 > 4)' },
  { input: 'A12345', description: 'too many digits (5 > 4)' },

  // Mixed format
  {
    input: 'A1B2',
    description: 'mixed format - letters and digits interleaved',
  },
  { input: '123ABC', description: 'mixed format - digits before letters' },

  // Special characters
  { input: 'A-1', description: 'special characters not allowed' },
  { input: 'A 1', description: 'spaces not allowed' },

  // Edge cases
  { input: '', description: 'empty string' },
  { input: '   ', description: 'whitespace only' },
  { input: '  A1', description: 'leading whitespace' },
  { input: 'A1  ', description: 'trailing whitespace' },

  // Non-string inputs
  { input: null, description: 'null input' },
  { input: undefined, description: 'undefined input' },
  { input: 123, description: 'number input' },
  { input: true, description: 'boolean input' },
  { input: {}, description: 'object input' },
];

describe('stringIncrement', () => {
  describe('valid inputs', () => {
    // Data-driven tests for valid cases
    validTestCases.forEach(({ input, expected, description }) => {
      it(`should increment "${input}" to "${expected}" (${description})`, () => {
        expect(stringIncrement(input)).toBe(expected);
      });
    });
  });

  describe('invalid inputs', () => {
    // Data-driven tests for invalid cases
    invalidTestCases.forEach(({ input, description }) => {
      it(`should return "Error" for "${input}" (${description})`, () => {
        expect(stringIncrement(input as any)).toBe('Error');
      });
    });
  });

  describe('performance', () => {
    it('should handle large number of operations efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 10000; i++) {
        stringIncrement('A1');
        stringIncrement('FX001');
        stringIncrement('INVALID');
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete 30,000 operations in less than 1 second
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle edge case operations efficiently', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        stringIncrement('A9999'); // Overflow case
        stringIncrement('ABCD1234'); // Maximum valid case
        stringIncrement(''); // Empty string case
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete 3,000 operations in less than 100ms
      expect(executionTime).toBeLessThan(100);
    });
  });
});
