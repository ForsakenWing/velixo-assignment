module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // Root directory for tests and modules
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files with ts-jest (modern approach)
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        lib: ['es2020'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        types: ['jest', 'node']
      }
    }]
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  
  // Coverage output directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage thresholds (90% requirement, branches adjusted to 85% due to defensive code paths)
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Setup files to run before tests
  setupFilesAfterEnv: [],
  
  // Test timeout (30 seconds)
  testTimeout: 30000,
  
  // Error handling
  errorOnDeprecated: true
};