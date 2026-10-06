// Test that stale SolHUD hide timers don't cut locked chip short
// Uses REAL SolHUD from src/ui/sol-hud.js
// Run with: node test-stale-hud-timeout.js

const fs = require('fs');

// Minimal DOM stubs for SolHUD
global.document = {
    createElement: (tag) => ({
        id: null,
        style: {
            cssText: '',
            opacity: '0'
        },
        textContent: '',
        appendChild: () => {}
    }),
    getElementById: (id) => {
        if (id === 'ui-overlay') {
            return {
                appendChild: () => {}
            };
        }
        if (id === 'sol-hud') {
            return global.testHudElement;
        }
        return null;
    }
};

// Track the actual HUD element
global.testHudElement = null;

function loadSolHUD() {
    const code = fs.readFileSync('./src/ui/sol-hud.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', 'document', `
        ${code}
        sandbox.SolHUD = SolHUD;
    `);
    wrapper(sandbox, global.document);
    return sandbox.SolHUD;
}

const SolHUD = loadSolHUD();

console.log('=== Stale HUD Timeout Test (Real SolHUD) ===\n');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ ${testName}`);
        passed++;
    } else {
        console.log(`❌ ${testName}`);
        failed++;
    }
}

console.log('Test 1: Abandoned flash timeout cleared by subsequent showLocked()');
const hud1 = new SolHUD();
global.testHudElement = hud1.element;

// Abandon job - sets 1.5s hide timeout
hud1.showAbandoned();
assert(hud1.currentState === 'abandoned', '1a: Abandoned state set');
assert(hud1.element.style.opacity === '1', '1b: HUD visible');
assert(hud1.payoutFlashTimeout !== null, '1c: Timeout is pending');

const oldTimeout1 = hud1.payoutFlashTimeout;

// Re-enter within 0.5s and show locked chip
setTimeout(() => {
    hud1.showLocked({ skill: 'design', minXp: 10 }, { getXp: () => 5 });
    
    assert(hud1.currentState === 'locked', '1d: Locked state set');
    assert(hud1.element.style.opacity === '1', '1e: HUD visible after locked');
    assert(hud1.payoutFlashTimeout === null, '1f: Old timeout was cleared by show()');
    assert(hud1.payoutFlashTimeout !== oldTimeout1, '1g: Different timeout ID');
    
    // Check at 1.7s (should still be locked, not hidden by stale timeout)
    setTimeout(() => {
        assert(hud1.currentState === 'locked', '1h: Still locked at 1.7s (stale timeout cleared)');
        assert(hud1.element.style.opacity === '1', '1i: Still visible at 1.7s');
        
        console.log('\nTest 2: Payout flash timeout cleared by subsequent showLocked()');
        const hud2 = new SolHUD();
        global.testHudElement = hud2.element;
        
        // Show payout - sets 1.5s hide timeout
        hud2.showPayout(50, { amount: 10, skill: 'coding' });
        assert(hud2.currentState === 'payout', '2a: Payout state set');
        assert(hud2.element.style.opacity === '1', '2b: HUD visible');
        assert(hud2.payoutFlashTimeout !== null, '2c: Timeout is pending');
        
        const oldTimeout2 = hud2.payoutFlashTimeout;
        
        // Re-enter within 0.5s and show locked chip
        setTimeout(() => {
            hud2.showLocked({ skill: 'design', minXp: 10 }, { getXp: () => 5 });
            
            assert(hud2.currentState === 'locked', '2d: Locked state set');
            assert(hud2.element.style.opacity === '1', '2e: HUD visible after locked');
            assert(hud2.payoutFlashTimeout === null, '2f: Old payout timeout was cleared');
            assert(hud2.payoutFlashTimeout !== oldTimeout2, '2g: Different timeout ID');
            
            // Check at 1.7s
            setTimeout(() => {
                assert(hud2.currentState === 'locked', '2h: Still locked at 1.7s');
                assert(hud2.element.style.opacity === '1', '2i: Still visible at 1.7s');
                
                console.log('\nTest 3: Sanity check - stale timer DOES hide HUD if not cleared');
                // This reproduces the bug: if we don't call show() (which clears the timeout),
                // the old timeout will fire and hide the HUD
                const hud3 = new SolHUD();
                global.testHudElement = hud3.element;
                
                // Simulate abandoned flash
                hud3.showAbandoned();
                
                // Manually change state WITHOUT calling show() (bypassing the fix)
                setTimeout(() => {
                    // Change state directly without calling show()
                    hud3.currentState = 'locked';
                    hud3.element.textContent = 'Locked — design XP 5/10';
                    hud3.element.style.opacity = '1';
                    // Note: payoutFlashTimeout still pending because we didn't call show()
                    
                    // At 1.6s total (1.5s after showAbandoned), the timeout fires
                    setTimeout(() => {
                        // The bug: stale timeout fired and called hide()
                        assert(hud3.currentState === null, '3a: State nulled by stale timeout (bug reproduced)');
                        assert(hud3.element.style.opacity === '0', '3b: HUD hidden by stale timeout (bug reproduced)');
                        
                        console.log('\nTest 4: Verify the FIX prevents the bug');
                        const hud4 = new SolHUD();
                        global.testHudElement = hud4.element;
                        
                        // Same sequence but using the REAL show() which clears timeouts
                        hud4.showAbandoned();
                        
                        setTimeout(() => {
                            // Call the REAL show() method (via showLocked) which clears the timeout
                            hud4.showLocked({ skill: 'design', minXp: 10 }, { getXp: () => 5 });
                            
                            // At 1.6s, the old timeout should NOT fire because show() cleared it
                            setTimeout(() => {
                                assert(hud4.currentState === 'locked', '4a: State still locked (fix works)');
                                assert(hud4.element.style.opacity === '1', '4b: HUD still visible (fix works)');
                                
                                console.log('\n=== Summary ===');
                                console.log(`Passed: ${passed}`);
                                console.log(`Failed: ${failed}`);
                                console.log(`Total: ${passed + failed}`);
                                
                                if (failed === 0) {
                                    console.log('\n✅ All tests passed!');
                                    console.log('\nSanity check confirmed: Test 3 reproduced the bug (stale timeout hiding HUD)');
                                    console.log('and Test 4 verified the fix (show() clears old timeouts).');
                                    process.exit(0);
                                } else {
                                    console.log(`\n❌ ${failed} test(s) failed`);
                                    process.exit(1);
                                }
                            }, 1200); // 1.6s after abandoned
                        }, 400); // 400ms after abandoned
                    }, 1200); // 1.6s after manual state change
                }, 400); // 400ms after showAbandoned
            }, 1200); // 1.7s after payout
        }, 400); // 0.4s after payout
    }, 1200); // 1.7s after abandoned
}, 400); // 0.4s after abandoned
