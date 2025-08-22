import * as fs from 'fs';
import * as path from 'path';
import { TestConfiguration } from './types';

/**
 * Configuration loader with environment variable support
 */
export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: TestConfiguration | null = null;

  private constructor() {}

  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Load configuration from file with environment variable overrides
   */
  loadConfig(): TestConfiguration {
    if (this.config) {
      return this.config;
    }

    try {
      // Try to load from test-config.json first, then fall back to template
      const configPath = this.findConfigFile();
      const fileConfig = this.loadConfigFromFile(configPath);
      
      // Override with environment variables
      this.config = this.applyEnvironmentOverrides(fileConfig);
      
      // Validate required fields
      this.validateConfig(this.config);
      
      console.log('✅ Configuration loaded successfully');
      return this.config;
    } catch (error) {
      console.error('❌ Failed to load configuration:', error);
      throw new Error(`Configuration loading failed: ${error}`);
    }
  }

  /**
   * Find the configuration file
   */
  private findConfigFile(): string {
    const configDir = path.join(__dirname, '../../config');
    const configFile = path.join(configDir, 'test-config.json');
    const templateFile = path.join(configDir, 'test-config.template.json');

    if (fs.existsSync(configFile)) {
      return configFile;
    } else if (fs.existsSync(templateFile)) {
      console.warn('⚠️ Using template config file. Please create test-config.json with your credentials.');
      return templateFile;
    } else {
      throw new Error('No configuration file found. Please create config/test-config.json');
    }
  }

  /**
   * Load configuration from JSON file
   */
  private loadConfigFromFile(filePath: string): TestConfiguration {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as TestConfiguration;
    } catch (error) {
      throw new Error(`Failed to parse configuration file ${filePath}: ${error}`);
    }
  }

  /**
   * Apply environment variable overrides
   */
  private applyEnvironmentOverrides(config: TestConfiguration): TestConfiguration {
    const overriddenConfig = { ...config };

    // Excel credentials from environment
    if (process.env.EXCEL_USERNAME) {
      overriddenConfig.excel.credentials.username = process.env.EXCEL_USERNAME;
    }
    if (process.env.EXCEL_PASSWORD) {
      overriddenConfig.excel.credentials.password = process.env.EXCEL_PASSWORD;
    }

    // Browser settings from environment
    if (process.env.HEADLESS) {
      overriddenConfig.browser.headless = process.env.HEADLESS.toLowerCase() === 'true';
    }
    if (process.env.SLOW_MO) {
      overriddenConfig.browser.slowMo = parseInt(process.env.SLOW_MO, 10);
    }

    // Timeout overrides
    if (process.env.TEST_TIMEOUT) {
      overriddenConfig.excel.timeouts.test = parseInt(process.env.TEST_TIMEOUT, 10);
    }

    return overriddenConfig;
  }

  /**
   * Validate configuration has required fields
   */
  private validateConfig(config: TestConfiguration): void {
    const errors: string[] = [];

    // Check required Excel configuration
    if (!config.excel?.credentials?.username) {
      errors.push('Excel username is required');
    }
    if (!config.excel?.credentials?.password) {
      errors.push('Excel password is required');
    }
    if (!config.excel?.baseUrl) {
      errors.push('Excel base URL is required');
    }

    // Check browser configuration
    if (!config.browser?.viewport?.width || !config.browser?.viewport?.height) {
      errors.push('Browser viewport dimensions are required');
    }

    // Validate timeout values
    if (config.excel?.timeouts?.navigation && config.excel.timeouts.navigation < 1000) {
      errors.push('Navigation timeout must be at least 1000ms');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    // Warn about template credentials
    if (config.excel.credentials.username.includes('example.com')) {
      console.warn('⚠️ Using template credentials. Please update with real credentials.');
    }
  }

  /**
   * Get specific configuration section
   */
  getExcelConfig() {
    return this.loadConfig().excel;
  }

  getBrowserConfig() {
    return this.loadConfig().browser;
  }

  /**
   * Check if running in CI environment
   */
  isCI(): boolean {
    return !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL);
  }

  /**
   * Get environment-specific settings
   */
  getEnvironmentSettings() {
    const isCI = this.isCI();
    const config = this.loadConfig();

    return {
      headless: isCI || config.browser.headless,
      slowMo: isCI ? 0 : config.browser.slowMo,
      retries: isCI ? 3 : 1,
      timeout: isCI ? config.excel.timeouts.test * 1.5 : config.excel.timeouts.test
    };
  }
}