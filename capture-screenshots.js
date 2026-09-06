const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
    const browser = await playwright.chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    const outputDir = '/workspace/artifacts/verify-dev-tycoon';
    
    console.log('Navigating to game...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    
    console.log('Waiting for game to initialize...');
    await page.waitForTimeout(3000);
    
    // Click canvas to lock pointer
    console.log('Locking pointer...');
    await page.click('canvas');
    await page.waitForTimeout(1000);
    
    // Take initial spawn screenshot
    console.log('Taking initial screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'spawn-view.png') });
    
    // Move southwest to cafe (W and A keys)
    console.log('Moving to cafe (southwest)...');
    await page.keyboard.down('w');
    await page.keyboard.down('a');
    await page.waitForTimeout(4000);
    await page.keyboard.up('w');
    await page.keyboard.up('a');
    await page.waitForTimeout(500);
    
    // Take cafe exterior screenshot
    console.log('Taking cafe exterior screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'cafe-exterior.png') });
    
    // Press E to enter
    console.log('Entering cafe...');
    await page.keyboard.press('e');
    await page.waitForTimeout(1000);
    
    // Take cafe interior screenshot
    console.log('Taking cafe interior screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'cafe-interior.png') });
    
    // Wait for job offer HUD
    await page.waitForTimeout(500);
    
    // Take HUD accept screenshot
    console.log('Taking HUD accept screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'hud-accept.png') });
    
    // Press E to accept job
    console.log('Accepting job...');
    await page.keyboard.press('e');
    await page.waitForTimeout(1000);
    
    // Take HUD fixing screenshot
    console.log('Taking HUD fixing screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'hud-fixing.png') });
    
    // Press E to complete immediately
    console.log('Completing job...');
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    
    // Take HUD payout screenshot
    console.log('Taking HUD payout screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'hud-payout.png') });
    
    console.log('All screenshots captured!');
    console.log('Screenshots saved to:', outputDir);
    
    await browser.close();
}

captureScreenshots().catch(console.error);
