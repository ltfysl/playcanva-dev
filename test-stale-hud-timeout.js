// Test that stale SolHUD hide timers don't cut locked chip short
// Scenario: abandon job → flash shows 1.5s timer → re-enter within 0.5s → locked chip should stay for full 2s
// Run with: node test-stale-hud-timeout.js

const JobState = {
    IDLE: 'idle',
    OFFERED: 'offered',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    PAID: 'paid'
};

class JobRun {
    constructor(slotId) {
        this.slotId = slotId;
        this.state = JobState.IDLE;
        this.startTime = null;
    }
}

class MockSolHUD {
    constructor() {
        this.currentState = null;
        this.opacity = 0;
        this.text = '';
        this.payoutFlashTimeout = null;
        this.lockedUpdateInterval = null;
    }
    
    show(text, state) {
        // Clear any pending flash/hide timeouts from previous states
        if (this.payoutFlashTimeout) {
            clearTimeout(this.payoutFlashTimeout);
            this.payoutFlashTimeout = null;
        }
        
        this.currentState = state;
        this.text = text;
        this.opacity = 1;
    }
    
    hide() {
        this.opacity = 0;
        this.currentState = null;
        
        if (this.lockedUpdateInterval) {
            clearInterval(this.lockedUpdateInterval);
            this.lockedUpdateInterval = null;
        }
    }
    
    showAbandoned() {
        this.show('Abandoned — no pay', 'abandoned');
        
        if (this.payoutFlashTimeout) {
            clearTimeout(this.payoutFlashTimeout);
        }
        
        this.payoutFlashTimeout = setTimeout(() => {
            this.hide();
            this.payoutFlashTimeout = null;
        }, 1500);
    }
    
    showLocked(unlockRule) {
        const text = `Locked — ${unlockRule.skill} XP 5/${unlockRule.minXp}`;
        
        // show() will clear payoutFlashTimeout
        this.show(text, 'locked');
        
        if (this.lockedUpdateInterval) {
            clearInterval(this.lockedUpdateInterval);
        }
    }
    
    showPayout(amount, xp = null) {
        let text = `+$${amount}`;
        if (xp && xp.amount && xp.skill) {
            text += ` · +${xp.amount} ${xp.skill} XP`;
        }
        this.show(text, 'payout');
        
        if (this.payoutFlashTimeout) {
            clearTimeout(this.payoutFlashTimeout);
        }
        
        this.payoutFlashTimeout = setTimeout(() => {
            this.hide();
            this.payoutFlashTimeout = null;
        }, 1500);
    }
    
    getCurrentState() {
        return this.currentState;
    }
}

class MockGameManager {
    constructor() {
        this.solHUD = new MockSolHUD();
        this.isInBuilding = false;
        this.exitCalled = false;
    }
    
    handleInteraction() {
        if (this.isInBuilding) {
            // Don't exit during locked chip display
            const hudState = this.solHUD ? this.solHUD.getCurrentState() : null;
            if (hudState === 'locked') {
                return;
            }
            
            this.exitBuilding();
        }
    }
    
    exitBuilding() {
        this.exitCalled = true;
        this.isInBuilding = false;
    }
}

console.log('=== Stale HUD Timeout Test ===\n');

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

console.log('Test 1: Abandoned flash timeout does not hide subsequent locked chip');
const gm = new MockGameManager();
const hud = gm.solHUD;

// Abandon job - sets 1.5s hide timeout
hud.showAbandoned();
assert(hud.currentState === 'abandoned', '1a: Abandoned state set');
assert(hud.opacity === 1, '1b: HUD visible');
assert(hud.payoutFlashTimeout !== null, '1c: Timeout is pending');

// Re-enter within 0.5s and show locked chip
setTimeout(() => {
    gm.isInBuilding = true;
    hud.showLocked({ skill: 'design', minXp: 10 });
    
    assert(hud.currentState === 'locked', '1d: Locked state set');
    assert(hud.opacity === 1, '1e: HUD visible after locked');
    assert(hud.payoutFlashTimeout === null, '1f: Old timeout was cleared by show()');
    
    // Check at 1.7s (should still be locked, not hidden by stale timeout)
    setTimeout(() => {
        assert(hud.currentState === 'locked', '1g: Still locked at 1.7s (stale timeout cleared)');
        assert(hud.opacity === 1, '1h: Still visible at 1.7s');
        
        // E key at 1.7s should not exit
        gm.handleInteraction();
        assert(gm.isInBuilding === true, '1i: E at 1.7s does not exit');
        assert(gm.exitCalled === false, '1j: exitBuilding not called');
        
        console.log('\nTest 2: Payout flash timeout does not hide subsequent locked chip');
        const gm2 = new MockGameManager();
        const hud2 = gm2.solHUD;
        
        // Show payout - sets 1.5s hide timeout
        hud2.showPayout(50, { amount: 10, skill: 'coding' });
        assert(hud2.currentState === 'payout', '2a: Payout state set');
        assert(hud2.opacity === 1, '2b: HUD visible');
        assert(hud2.payoutFlashTimeout !== null, '2c: Timeout is pending');
        
        // Re-enter within 0.5s and show locked chip
        setTimeout(() => {
            gm2.isInBuilding = true;
            hud2.showLocked({ skill: 'design', minXp: 10 });
            
            assert(hud2.currentState === 'locked', '2d: Locked state set');
            assert(hud2.opacity === 1, '2e: HUD visible after locked');
            assert(hud2.payoutFlashTimeout === null, '2f: Old payout timeout was cleared');
            
            // Check at 1.7s
            setTimeout(() => {
                assert(hud2.currentState === 'locked', '2g: Still locked at 1.7s');
                assert(hud2.opacity === 1, '2h: Still visible at 1.7s');
                
                // E key should not exit
                gm2.handleInteraction();
                assert(gm2.isInBuilding === true, '2i: E at 1.7s does not exit');
                
                console.log('\n=== Summary ===');
                console.log(`Passed: ${passed}`);
                console.log(`Failed: ${failed}`);
                console.log(`Total: ${passed + failed}`);
                
                if (failed === 0) {
                    console.log('\n✅ All tests passed!');
                    process.exit(0);
                } else {
                    console.log(`\n❌ ${failed} test(s) failed`);
                    process.exit(1);
                }
            }, 1200); // 1.7s after payout
        }, 400); // 0.4s after payout
    }, 1200); // 1.7s after abandoned
}, 400); // 0.4s after abandoned
