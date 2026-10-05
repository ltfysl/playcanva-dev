// Final evidence capture for Slice-11 with keyboard navigation only
// NO teleporting, NO manual XP setting - pure WASD navigation

const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const VIEWPORT = { width: 1280, height: 720 };
const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts/verify-dev-tycoon/slice-11-design-gate');

if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForGame(page) {
    console.log('Waiting for game to initialize...');
    await page.waitForFunction(() => {
        return window.gameManager && 
               window.gameManager.player && 
               window.gameManager.cityModule;
    }, { timeout: 30000 });
    await sleep(2000);
    console.log('Game initialized');
}

async function hideControlsHint(page) {
    await page.evaluate(() => {
        const hint = document.getElementById('controls-hint');
        if (hint) hint.style.display = 'none';
    });
}

async function getPlayerPosition(page) {
    return await page.evaluate(() => {
        const pos = window.gameManager.player.getPosition();
        return { x: pos.x, y: pos.y, z: pos.z };
    });
}

async function walkTo(page, targetX, targetZ, timeoutMs = 30000) {
    console.log(`Walking to (${targetX}, ${targetZ})`);
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
        const pos = await getPlayerPosition(page);
        const dx = targetX - pos.x;
        const dz = targetZ - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 1.5) {
            console.log(`Reached target at (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`);
            return true;
        }
        
        // Determine which key to press
        let key = null;
        if (Math.abs(dz) > Math.abs(dx)) {
            key = dz > 0 ? 's' : 'w';
        } else {
            key = dx > 0 ? 'd' : 'a';
        }
        
        await page.keyboard.down(key);
        await sleep(150);
        await page.keyboard.up(key);
    }
    
    const finalPos = await getPlayerPosition(page);
    console.log(`Timeout walking to target. Final: (${finalPos.x.toFixed(1)}, ${finalPos.z.toFixed(1)})`);
    return false;
}

async function pressE(page) {
    await page.keyboard.press('e');
    await sleep(500);
}

async function waitForHUD(page, expectedTextRegex, timeoutMs = 10000) {
    console.log(`Waiting for HUD: ${expectedTextRegex}`);
    
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
        const hudInfo = await page.evaluate(() => {
            const hud = document.getElementById('sol-hud');
            if (!hud) return null;
            
            const opacity = parseFloat(window.getComputedStyle(hud).opacity);
            const text = hud.textContent;
            
            return { opacity, text };
        });
        
        if (hudInfo && hudInfo.opacity >= 0.9 && expectedTextRegex.test(hudInfo.text)) {
            console.log(`HUD matched: "${hudInfo.text}"`);
            return hudInfo.text;
        }
        
        await sleep(100);
    }
    
    const currentHUD = await page.evaluate(() => {
        const hud = document.getElementById('sol-hud');
        return hud ? hud.textContent : 'no HUD';
    });
    throw new Error(`Timeout waiting for HUD matching ${expectedTextRegex}. Current: "${currentHUD}"`);
}

async function screenshot(page, filename) {
    const filepath = path.join(ARTIFACTS_DIR, filename);
    await page.screenshot({ path: filepath });
    console.log(`✓ Screenshot saved: ${filename}`);
}

async function getSkillXP(page, skill) {
    return await page.evaluate((skillName) => {
        return window.gameManager.skillsStub.getXp(skillName);
    }, skill);
}

async function main() {
    console.log('=== Slice-11 Final Evidence Capture ===\n');
    
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--use-gl=swiftshader'
        ]
    });
    
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    const page = await context.newPage();
    
    try {
        console.log(`Loading game at ${BASE_URL}`);
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await page.click('canvas');
        await sleep(500);
        
        await waitForGame(page);
        await hideControlsHint(page);
        
        const startPos = await getPlayerPosition(page);
        console.log(`Starting position: (${startPos.x.toFixed(1)}, ${startPos.z.toFixed(1)})`);
        
        console.log('\n--- Phase 1: Two Practice Design sessions (+10 design XP) ---');
        
        // Walk to home: S to z≈28, D to x≈20
        await walkTo(page, 20, 28);
        await pressE(page); // Enter home
        await sleep(1000);
        
        // First activity: Practice coding (round-robin)
        await waitForHUD(page, /Practice coding|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+5 coding XP/i, 25000);
        await sleep(1000);
        
        await pressE(page); // Exit
        await sleep(2000);
        
        // Re-enter for Practice design
        await walkTo(page, 20, 28);
        await pressE(page);
        await sleep(1000);
        
        await waitForHUD(page, /Practice design|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+5 design XP/i, 25000);
        await sleep(1000);
        
        let designXP = await getSkillXP(page, 'design');
        console.log(`Design XP after first session: ${designXP}`);
        
        await pressE(page); // Exit
        await sleep(2000);
        
        console.log('\n--- Phase 2: Complete Quick Bugfix ---');
        
        // Walk to cafe: S/W to x≈-20, z≈30
        await walkTo(page, -20, 32);
        await pressE(page); // Enter cafe
        await sleep(1000);
        
        // Should see locked chip for 2s
        console.log('Waiting for locked chip (design XP 5/10)...');
        const lockedText = await waitForHUD(page, /Locked.*design XP.*5.*10/i, 3000);
        console.log(`✓ Locked chip: "${lockedText}"`);
        
        // CAPTURE #1: Locked chip
        await screenshot(page, 'locked-5-of-10.png');
        
        // Wait for bugfix offer after 2s delay
        await sleep(2500);
        await waitForHUD(page, /Quick bugfix|E —/i);
        await pressE(page); // Accept bugfix
        await waitForHUD(page, /\+.*50/i, 35000); // Wait for completion
        await sleep(2000);
        
        await pressE(page); // Exit cafe
        await sleep(2000);
        
        console.log('\n--- Phase 3: Second Practice Design (+5 design XP) ---');
        
        await walkTo(page, 20, 28);
        await pressE(page);
        await sleep(1000);
        
        // Practice coding first (round-robin)
        await waitForHUD(page, /Practice coding|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+5 coding XP/i, 25000);
        await sleep(1000);
        
        await pressE(page);
        await sleep(2000);
        
        // Practice design second
        await walkTo(page, 20, 28);
        await pressE(page);
        await sleep(1000);
        
        await waitForHUD(page, /Practice design|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+5 design XP/i, 25000);
        await sleep(1000);
        
        designXP = await getSkillXP(page, 'design');
        console.log(`Design XP after second session: ${designXP}`);
        
        if (designXP < 10) {
            throw new Error(`Expected design XP >= 10, got ${designXP}`);
        }
        
        await pressE(page);
        await sleep(2000);
        
        console.log('\n--- Phase 4: Capture Unlocked Offer ($120) ---');
        
        await walkTo(page, -20, 32);
        await pressE(page);
        await sleep(1000);
        
        // Should offer cafe-feature-1 at $120 (priority over bugfix)
        const offerText = await waitForHUD(page, /Small feature patch|120/i);
        console.log(`✓ Offer: "${offerText}"`);
        
        if (!/120/.test(offerText)) {
            throw new Error(`Offer text missing $120: "${offerText}"`);
        }
        
        // CAPTURE #2: Unlocked offer
        await screenshot(page, 'offer-unlocked.png');
        
        console.log('\n--- Phase 5: Capture Payout Flash ---');
        
        await pressE(page); // Accept
        await sleep(500);
        
        console.log('Waiting for gig completion (~45s)...');
        const payoutText = await waitForHUD(page, /\+.*120.*15 coding XP/i, 50000);
        console.log(`✓ Payout: "${payoutText}"`);
        
        if (!/120/.test(payoutText) || !/15 coding XP/.test(payoutText)) {
            throw new Error(`Payout text incorrect: "${payoutText}"`);
        }
        
        // CAPTURE #3: Payout flash (must be quick!)
        await screenshot(page, 'payout-flash.png');
        
        console.log('\n=== All Evidence Captured Successfully ===');
        console.log('Screenshots:');
        console.log('  - locked-5-of-10.png');
        console.log('  - offer-unlocked.png');
        console.log('  - payout-flash.png');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        const debugPath = path.join(ARTIFACTS_DIR, 'debug-error.png');
        await page.screenshot({ path: debugPath });
        console.log(`Debug screenshot: ${debugPath}`);
        
        throw error;
    } finally {
        await browser.close();
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
