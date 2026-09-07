const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureHomeScreenshots() {
    const browser = await playwright.chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(`[${msg.type()}] ${text}`);
        console.log(`Console: ${text}`);
    });
    
    const outputDir = '/workspace/artifacts/verify-dev-tycoon/home-practice';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log('Navigating to game...');
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
    
    console.log('Waiting for game to initialize...');
    await page.waitForTimeout(5000);
    
    console.log('Locking pointer...');
    await page.click('canvas');
    await page.waitForTimeout(1000);
    
    console.log('Moving to home (east)...');
    await page.keyboard.down('d');
    await page.waitForTimeout(3500);
    await page.keyboard.up('d');
    await page.waitForTimeout(500);
    
    console.log('Entering home...');
    await page.keyboard.press('e');
    await page.waitForTimeout(2000);
    
    console.log('Taking HUD practice offer screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'hud-practice-offer.png') });
    
    console.log('Accepting practice...');
    await page.keyboard.press('e');
    await page.waitForTimeout(2000);
    
    console.log('Taking HUD practicing screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'hud-practicing.png') });
    
    console.log('Waiting for practice to auto-complete...');
    await page.waitForTimeout(22000);
    
    console.log('Taking HUD XP payout screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'hud-xp-payout.png') });
    
    await page.waitForTimeout(3000);
    
    console.log('Taking HUD re-offer screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'hud-practice-reoffer.png') });
    
    console.log('Accepting second practice...');
    await page.keyboard.press('e');
    await page.waitForTimeout(2000);
    
    console.log('Exiting home while practicing (e-seam test)...');
    await page.keyboard.press('e');
    await page.waitForTimeout(2000);
    
    console.log('Taking exit completion screenshot...');
    await page.screenshot({ path: path.join(outputDir, 'exit-e-seam-payout.png') });
    
    // Save console logs
    const logPath = path.join(outputDir, 'console-log.txt');
    fs.writeFileSync(logPath, consoleLogs.join('\n'));
    
    console.log('All home practice screenshots captured!');
    console.log('Screenshots saved to:', outputDir);
    console.log('Console logs saved to:', logPath);
    
    await page.waitForTimeout(2000);
    await browser.close();
}

captureHomeScreenshots().catch(console.error);
