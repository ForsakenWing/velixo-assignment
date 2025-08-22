import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Verify browser installation
  const browser = await chromium.launch();
  await browser.close();
  
  console.log('✅ Global setup completed successfully');
}

export default globalSetup;