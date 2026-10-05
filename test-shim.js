// Test shim: loads real modules and exports them for Node.js
const fs = require('fs');

// Minimal shims for Node.js environment
global.pc = {
    Vec3: class Vec3 {
        constructor(x, y, z) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
    }
};

// Load city-module.js and extract classes
function loadCityModule() {
    const cityModuleCode = fs.readFileSync('./src/core/city-module.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', 'pc', `
        ${cityModuleCode}
        sandbox.BuildingKind = BuildingKind;
        sandbox.UnlockState = UnlockState;
        sandbox.LocationId = LocationId;
        sandbox.Presence = Presence;
        sandbox.ActivitySlot = ActivitySlot;
        sandbox.ReputationSurface = ReputationSurface;
        sandbox.LocationData = LocationData;
        sandbox.CityModule = CityModule;
    `);
    wrapper(sandbox, global.pc);
    return sandbox;
}

// Load learn-runner.js and extract classes
function loadLearnRunner() {
    const learnRunnerCode = fs.readFileSync('./src/systems/learn-runner.js', 'utf8');
    const sandbox = {};
    const wrapper = new Function('sandbox', `
        ${learnRunnerCode}
        sandbox.LearnJobState = LearnJobState;
        sandbox.LearnJobRun = LearnJobRun;
        sandbox.LearnRunner = LearnRunner;
    `);
    wrapper(sandbox);
    return sandbox;
}

const cityModuleExports = loadCityModule();
const learnRunnerExports = loadLearnRunner();

module.exports = {
    ...cityModuleExports,
    ...learnRunnerExports
};
