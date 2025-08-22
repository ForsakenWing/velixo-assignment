/**
 * Type definitions for Excel Online E2E testing
 */

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TestConfiguration {
  excel: {
    baseUrl: string;
    credentials: LoginCredentials;
    timeouts: {
      navigation: number;
      element: number;
      test: number;
    };
  };
  browser: {
    headless: boolean;
    viewport: { width: number; height: number };
    slowMo: number;
  };
}

export interface DateValidationResult {
  isValid: boolean;
  expectedDate: string;
  actualDate: string;
  message: string;
}

export interface CellReference {
  address: string;
  row: number;
  column: string;
}

export interface FormulaResult {
  cellAddress: string;
  formula: string;
  result: string;
  resultType: 'date' | 'number' | 'text' | 'error';
}