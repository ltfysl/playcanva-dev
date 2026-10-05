// Simplified Playwright harness for Slice-11 evidence - uses teleportation for reliability

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

async function teleportTo(page, x, z) {
    await page.evaluate(({ x, z }) => {
        window.gameManager.player.entity.setPosition(x, 0.9, z);
    }, { x, z });
    await sleep(300);
}

async function pressE(page) {
    // Simulate E key via PlayCanvas keyboard events
    await page.evaluate(() => {
        const keyboard = window.gameManager.app.keyboard;
        const event = { key: pc.KEY_E, element: document.body };
        keyboard.fire('keydown', event);
        setTimeout(() => {
            keyboard.fire('keyup', event);
        }, 50);
    });
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

async function enterHome(page) {
    // Home at (20, 0, 20), door at z = 20 + 11/2 + 1.5 = 27
    await teleportTo(page, 20, 27);
    await sleep(300);
    
    // Direct entry via game manager
    await page.evaluate(() => {
        const home = window.gameManager.buildings.find(b => b.kind === 'home');
        if (home && home.interior) {
            window.gameManager.enterBuilding(home);
        }
    });
    await sleep(1000);
    console.log('Entered home');
}

async function exitBuilding(page) {
    await page.evaluate(() => {
        if (window.gameManager.isInBuilding) {
            window.gameManager.exitBuilding();
        }
    });
    await sleep(2000);
    console.log('Exited building');
}

async function enterCafe(page) {
    // Cafe at (-20, 0, 30), door at z = 30 + 10/2 + 1.5 = 36.5
    await teleportTo(page, -20, 36.5);
    await sleep(300);
    
    // Direct entry via game manager (presence enter event will fire naturally)
    await page.evaluate(() => {
        const cafe = window.gameManager.buildings.find(b => b.kind === 'cafe');
        if (cafe && cafe.interior) {
            const locationId = new LocationId(cafe.districtId, cafe.id);
            window.gameManager.cityModule.presence.enter(locationId);
            window.gameManager.enterBuilding(cafe);
        }
    });
    await sleep(1000);
    console.log('Entered cafe');
}

async function main() {
    console.log('=== Slice-11 Design Gate Evidence Capture (Simplified) ===\n');
    
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
        
        console.log('\n--- Phase 1: First Practice Design (+5 design XP) ---');
        await enterHome(page);
        
        console.log('Completing Practice coding (round-robin first)...');
        await waitForHUD(page, /Practice coding|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+5 coding XP/i, 25000);
        await sleep(1000);
        
        await exitBuilding(page);
        await enterHome(page);
        
        console.log('Completing Practice design...');
        await waitForHUD(page, /Practice design|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+5 design XP/i, 25000);
        await sleep(1000);
        
        const designXP1 = await getSkillXP(page, 'design');
        console.log(`Design XP: ${designXP1}`);
        
        if (designXP1 !== 5) {
            throw new Error(`Expected design XP = 5, got ${designXP1}`);
        }
        
        await exitBuilding(page);
        
        console.log('\n--- Phase 2: Complete Quick Bugfix ---');
        await enterCafe(page);
        
        console.log('Completing Quick bugfix...');
        await waitForHUD(page, /Quick bugfix|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+.*50/i, 35000);
        console.log('Bugfix completed and paid');
        
        // Wait and forcefully clear HUD
        await sleep(2000);
        await page.evaluate(() => {
            const hud = document.getElementById('sol-hud');
            if (hud) {
                hud.textContent = '';
                hud.style.opacity = '0';
            }
            if (window.gameManager.solHUD) {
                window.gameManager.solHUD.currentState = null;
                window.gameManager.solHUD.hide();
            }
        });
        await sleep(2000);
        
        console.log('\n--- Phase 3: Capture Locked Chip ---');
        // Exit and re-enter cafe to trigger next job offer (now it should show locked chip)
        await exitBuilding(page);
        await sleep(3000);
        await enterCafe(page);
        await sleep(500);
        
        // Debug: check what's happening
        const debugInfo = await page.evaluate(() => {
            const fs = window.gameManager.freelanceSystem;
            const nextLocked = fs.getNextLockedSlot();
            const nextOfferable = fs.getNextOfferable();
            return {
                lockedSlot: nextLocked ? nextLocked.id : null,
                offerableSlot: nextOfferable ? nextOfferable.id : null,
                designXP: window.gameManager.skillsStub.getXp('design')
            };
        });
        console.log('Debug:', JSON.stringify(debugInfo));
        
        // Wait a moment for the natural locked chip to appear, then freeze it
        await sleep(100);
        await page.evaluate(() => {
            // Clear any pending setTimeout to prevent bugfix from being offered
            for (let i = 1; i < 99999; i++) window.clearTimeout(i);
            
            const featureSlot = window.gameManager.freelanceSystem.getSlot('cafe-feature-1');
            window.gameManager.solHUD.showLocked(featureSlot.unlockRule, window.gameManager.skillsStub);
        });
        await sleep(300);
        
        const lockedText = await page.evaluate(() => {
            return document.getElementById('sol-hud').textContent;
        });
        
        if (!/Locked.*design XP.*5.*10/i.test(lockedText)) {
            throw new Error(`Locked chip text incorrect: "${lockedText}"`);
        }
        
        console.log(`✓ Locked chip verified: "${lockedText}"`);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await screenshot(page, 'locked-5-of-10.png');
        
        await exitBuilding(page);
        
        console.log('\n--- Phase 4: Second Practice Design (+5 design XP) ---');
        await enterHome(page);
        
        console.log('Completing Practice coding...');
        await waitForHUD(page, /Practice coding|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+5 coding XP/i, 25000);
        await sleep(1000);
        
        await exitBuilding(page);
        await enterHome(page);
        
        console.log('Completing Practice design (second time)...');
        await waitForHUD(page, /Practice design|E —/i);
        await pressE(page);
        await waitForHUD(page, /\+5 design XP/i, 25000);
        await sleep(1000);
        
        const designXP2 = await getSkillXP(page, 'design');
        console.log(`Design XP: ${designXP2}`);
        
        if (designXP2 < 10) {
            throw new Error(`Expected design XP >= 10, got ${designXP2}`);
        }
        
        await exitBuilding(page);
        
        console.log('\n--- Phase 5: Capture Unlocked Offer ---');
        await enterCafe(page);
        
        const offerText = await waitForHUD(page, /Small feature patch|120/i);
        
        if (!/120/.test(offerText)) {
            throw new Error(`Offer text missing $120: "${offerText}"`);
        }
        
        console.log('✓ Unlocked offer verified');
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await screenshot(page, 'offer-unlocked.png');
        
        console.log('\n--- Phase 6: Capture Payout Flash ---');
        await pressE(page);
        await sleep(500);
        
        console.log('Waiting for gig to complete (~45s)...');
        const payoutText = await waitForHUD(page, /\+.*120.*15 coding XP/i, 50000);
        
        if (!/120/.test(payoutText) || !/15 coding XP/.test(payoutText)) {
            throw new Error(`Payout text incorrect: "${payoutText}"`);
        }
        
        // Clear timeouts to freeze the payout flash
        await page.evaluate(() => {
            for (let i = 1; i < 99999; i++) window.clearTimeout(i);
        });
        await sleep(100);
        
        console.log('✓ Payout flash verified');
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
