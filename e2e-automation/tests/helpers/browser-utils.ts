import { Page, Browser, BrowserContext } from '@playwright/test';

/**
 * Utility functions for browser operations and common E2E tasks
 */
export class BrowserUtils {
  /**
   * Take a screenshot with timestamp
   */
  static async takeScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const path = `test-results/screenshots/${filename}`;
    
    await page.screenshot({ 
      path, 
      fullPage: true,
      type: 'png'
    });
    
    console.log(`📸 Screenshot saved: ${path}`);
    return path;
  }

  /**
   * Wait for network to be idle (no requests for specified time)
   */
  static async waitForNetworkIdle(page: Page, timeout: number = 2000): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Retry an operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw new Error(`Operation failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Sleep for specified milliseconds
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear browser data (cookies, local storage, etc.)
   */
  static async clearBrowserData(context: BrowserContext): Promise<void> {
    try {
      await context.clearCookies();
      await context.clearPermissions();
      
      // Clear local storage and session storage for all pages
      const pages = context.pages();
      for (const page of pages) {
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
      }
      
      console.log('🧹 Browser data cleared');
    } catch (error) {
      console.error('❌ Failed to clear browser data:', error);
    }
  }

  /**
   * Handle common dialog boxes (alert, confirm, prompt)
   */
  static setupDialogHandlers(page: Page): void {
    page.on('dialog', async dialog => {
      console.log(`📢 Dialog appeared: ${dialog.type()} - ${dialog.message()}`);
      
      switch (dialog.type()) {
        case 'alert':
          await dialog.accept();
          break;
        case 'confirm':
          await dialog.accept(); // Accept by default, can be customized
          break;
        case 'prompt':
          await dialog.accept(''); // Accept with empty string by default
          break;
        default:
          await dialog.dismiss();
      }
    });
  }

  /**
   * Wait for element to be stable (not moving/changing)
   */
  static async waitForElementStable(page: Page, selector: string, timeout: number = 5000): Promise<void> {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    
    // Wait for element to stop moving/changing
    let previousBoundingBox = await element.boundingBox();
    let stableCount = 0;
    const requiredStableChecks = 3;
    
    while (stableCount < requiredStableChecks) {
      await this.sleep(100);
      const currentBoundingBox = await element.boundingBox();
      
      if (this.boundingBoxesEqual(previousBoundingBox, currentBoundingBox)) {
        stableCount++;
      } else {
        stableCount = 0;
        previousBoundingBox = currentBoundingBox;
      }
    }
  }

  /**
   * Compare two bounding boxes for equality
   */
  private static boundingBoxesEqual(
    box1: { x: number; y: number; width: number; height: number } | null,
    box2: { x: number; y: number; width: number; height: number } | null
  ): boolean {
    if (!box1 || !box2) return box1 === box2;
    
    return box1.x === box2.x && 
           box1.y === box2.y && 
           box1.width === box2.width && 
           box1.height === box2.height;
  }

  /**
   * Get page performance metrics
   */
  static async getPerformanceMetrics(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
  }

  /**
   * Log page console messages
   */
  static setupConsoleLogging(page: Page): void {
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`🌐 Browser ${type}: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.error('🌐 Browser page error:', error.message);
    });
  }

  /**
   * Create a new incognito context for isolated testing
   */
  static async createIncognitoContext(browser: Browser): Promise<BrowserContext> {
    return await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      // Disable images and CSS for faster loading (optional)
      // extraHTTPHeaders: {
      //   'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      // }
    });
  }
}