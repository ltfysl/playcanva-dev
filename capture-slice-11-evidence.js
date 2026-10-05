// Headless Playwright harness for Slice-11 design gate evidence capture
// Captures 3 live PNGs: locked-5-of-10, offer-unlocked, payout-flash

const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const VIEWPORT = { width: 1280, height: 720 };
const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACTS_DIR = path.join(__dirname, 'artifacts/verify-dev-tycoon/slice-11-design-gate');

// Ensure artifacts directory exists
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
    
    // Wait for loading to finish
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

async function walkToPosition(page, targetX, targetZ, tolerance = 0.5) {
    console.log(`Walking to target: x=${targetX}, z=${targetZ}`);
    
    const maxAttempts = 200; // ~20 seconds at 100ms per iteration
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const pos = await getPlayerPosition(page);
        const dx = targetX - pos.x;
        const dz = targetZ - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < tolerance) {
            console.log(`Reached target at (${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`);
            return true;
        }
        
        // Determine which key to press
        let key = null;
        if (Math.abs(dz) > Math.abs(dx)) {
            key = dz > 0 ? 's' : 'w'; // S for +z, W for -z
        } else {
            key = dx > 0 ? 'd' : 'a'; // D for +x, A for -x
        }
        
        await page.keyboard.down(key);
        await sleep(100);
        await page.keyboard.up(key);
        
        attempts++;
    }
    
    console.log(`Warning: Could not reach target after ${maxAttempts} attempts`);
    const finalPos = await getPlayerPosition(page);
    console.log(`Final position: (${finalPos.x.toFixed(1)}, ${finalPos.z.toFixed(1)})`);
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
    console.log(`Screenshot saved: ${filename}`);
}

async function getSkillXP(page, skill) {
    return await page.evaluate((skillName) => {
        return window.gameManager.skillsStub.getXp(skillName);
    }, skill);
}

async function main() {
    console.log('=== Slice-11 Design Gate Evidence Capture ===\n');
    
    // Launch browser
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
    
    const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1
    });
    
    const page = await context.newPage();
    
    try {
        // 1. Load game with daytime parameter
        console.log(`Loading game at ${BASE_URL}/?daytime`);
        await page.goto(`${BASE_URL}/?daytime`, { waitUntil: 'networkidle' });
        
        // Click canvas to enable input
        await page.click('canvas');
        await sleep(500);
        
        await waitForGame(page);
        await hideControlsHint(page);
        
        console.log('\n--- Phase 1: First Practice Design (+5 design XP) ---');
        
        // 2. Walk to home door
        await walkToPosition(page, 20, 28.6);
        await pressE(page);
        await sleep(1000);
        
        // 3. First activity should be Practice coding (round-robin)
        console.log('Waiting for first offer (Practice coding)...');
        await waitForHUD(page, /Practice coding|E —/i);
        await pressE(page); // Accept
        await sleep(500);
        
        console.log('Waiting for coding practice to complete (~20s)...');
        await waitForHUD(page, /\+5 coding XP/i, 25000);
        await sleep(1000);
        
        const codingXP = await getSkillXP(page, 'coding');
        console.log(`Coding XP: ${codingXP}`);
        
        // 4. Exit home
        await pressE(page);
        await sleep(2000);
        
        // 5. Re-enter home for second activity (Practice design)
        await pressE(page);
        await sleep(1000);
        
        console.log('Waiting for second offer (Practice design)...');
        await waitForHUD(page, /Practice design|E —/i);
        await pressE(page); // Accept
        await sleep(500);
        
        console.log('Waiting for design practice to complete (~20s)...');
        await waitForHUD(page, /\+5 design XP/i, 25000);
        await sleep(1000);
        
        const designXP1 = await getSkillXP(page, 'design');
        console.log(`Design XP: ${designXP1}`);
        
        if (designXP1 !== 5) {
            throw new Error(`Expected design XP = 5, got ${designXP1}`);
        }
        
        // 6. Exit home
        await pressE(page);
        await sleep(2000);
        
        console.log('\n--- Phase 2: Complete Quick Bugfix ---');
        
        // 7. Walk to cafe
        await walkToPosition(page, -20, 34);
        
        // Try to enter cafe
        let entered = false;
        for (let z = 30; z <= 38; z += 1) {
            await walkToPosition(page, -20, z, 0.3);
            await pressE(page);
            await sleep(500);
            
            // Check if we entered
            const isInBuilding = await page.evaluate(() => {
                return window.gameManager.isInBuilding;
            });
            
            if (isInBuilding) {
                console.log(`Entered cafe at z=${z}`);
                entered = true;
                break;
            }
        }
        
        if (!entered) {
            console.log('Could not enter via walking, trying direct teleport...');
            await page.evaluate(() => {
                window.gameManager.player.entity.setPosition(-20, 0.9, 34);
            });
            await sleep(500);
            await pressE(page);
            await sleep(1000);
        }
        
        // 8. Complete Quick bugfix gig
        console.log('Waiting for Quick bugfix offer...');
        await waitForHUD(page, /Quick bugfix|E —|50/i);
        await pressE(page); // Accept
        await sleep(500);
        
        console.log('Waiting for bugfix to complete (~30s)...');
        await waitForHUD(page, /\+.*50.*coding XP/i, 35000);
        await sleep(2000);
        
        console.log('\n--- Phase 3: Capture Locked Chip ---');
        
        // 9. After bugfix paid, next offer should show locked cafe-feature-1
        console.log('Waiting for locked chip...');
        const lockedText = await waitForHUD(page, /Locked.*design XP.*5.*10/i, 5000);
        
        if (!/Locked.*design XP.*5.*10/.test(lockedText)) {
            throw new Error(`Locked chip text incorrect: "${lockedText}"`);
        }
        
        console.log('✓ Locked chip verified');
        await screenshot(page, 'locked-5-of-10.png');
        
        // 10. Exit cafe
        await pressE(page);
        await sleep(2000);
        
        console.log('\n--- Phase 4: Second Practice Design (+5 design XP) ---');
        
        // 11. Walk back to home
        await walkToPosition(page, 20, 28.6);
        await pressE(page);
        await sleep(1000);
        
        // 12. First offer after re-entry (round-robin: coding)
        console.log('Waiting for Practice coding...');
        await waitForHUD(page, /Practice coding|E —/i);
        await pressE(page);
        await sleep(500);
        
        console.log('Waiting for coding practice to complete...');
        await waitForHUD(page, /\+5 coding XP/i, 25000);
        await sleep(1000);
        
        // 13. Exit and re-enter for design
        await pressE(page);
        await sleep(2000);
        await pressE(page);
        await sleep(1000);
        
        console.log('Waiting for Practice design (second time)...');
        await waitForHUD(page, /Practice design|E —/i);
        await pressE(page);
        await sleep(500);
        
        console.log('Waiting for design practice to complete...');
        await waitForHUD(page, /\+5 design XP/i, 25000);
        await sleep(1000);
        
        const designXP2 = await getSkillXP(page, 'design');
        console.log(`Design XP: ${designXP2}`);
        
        if (designXP2 < 10) {
            throw new Error(`Expected design XP >= 10, got ${designXP2}`);
        }
        
        // 14. Exit home
        await pressE(page);
        await sleep(2000);
        
        console.log('\n--- Phase 5: Capture Unlocked Offer ---');
        
        // 15. Walk to cafe
        await walkToPosition(page, -20, 34);
        
        // Enter cafe
        entered = false;
        for (let z = 30; z <= 38; z += 1) {
            await walkToPosition(page, -20, z, 0.3);
            await pressE(page);
            await sleep(500);
            
            const isInBuilding = await page.evaluate(() => {
                return window.gameManager.isInBuilding;
            });
            
            if (isInBuilding) {
                entered = true;
                break;
            }
        }
        
        if (!entered) {
            await page.evaluate(() => {
                window.gameManager.player.entity.setPosition(-20, 0.9, 34);
            });
            await sleep(500);
            await pressE(page);
            await sleep(1000);
        }
        
        // 16. Wait for unlocked offer
        console.log('Waiting for unlocked offer (Small feature patch $120)...');
        const offerText = await waitForHUD(page, /Small feature patch|120/i);
        
        if (!/120/.test(offerText)) {
            throw new Error(`Offer text missing $120: "${offerText}"`);
        }
        
        console.log('✓ Unlocked offer verified');
        await screenshot(page, 'offer-unlocked.png');
        
        console.log('\n--- Phase 6: Capture Payout Flash ---');
        
        // 17. Accept the gig
        await pressE(page);
        await sleep(500);
        
        // Verify "Fixing..." state
        const fixingText = await page.evaluate(() => {
            const hud = document.getElementById('sol-hud');
            return hud ? hud.textContent : '';
        });
        console.log(`In-progress state: "${fixingText}"`);
        
        // 18. Wait for completion (~45s)
        console.log('Waiting for gig to complete (~45s)...');
        const payoutText = await waitForHUD(page, /\+.*120.*15 coding XP/i, 50000);
        
        if (!/120/.test(payoutText) || !/15 coding XP/.test(payoutText)) {
            throw new Error(`Payout text incorrect: "${payoutText}"`);
        }
        
        console.log('✓ Payout flash verified');
        await screenshot(page, 'payout-flash.png');
        
        console.log('\n=== All Evidence Captured Successfully ===');
        console.log('Screenshots saved to:', ARTIFACTS_DIR);
        console.log('  - locked-5-of-10.png');
        console.log('  - offer-unlocked.png');
        console.log('  - payout-flash.png');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        // Debug screenshot
        const debugPath = path.join(ARTIFACTS_DIR, 'debug-error.png');
        await page.screenshot({ path: debugPath });
        console.log(`Debug screenshot saved: ${debugPath}`);
        
        throw error;
    } finally {
        await browser.close();
    }
}

// Run
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
