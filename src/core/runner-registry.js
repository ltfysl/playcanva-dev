class RunnerRegistry {
    constructor() {
        this.runners = new Map();
    }
    
    register(kind, runner) {
        this.runners.set(kind, runner);
    }
    
    get(kind) {
        return this.runners.get(kind);
    }
    
    has(kind) {
        return this.runners.has(kind);
    }
    
    clear() {
        this.runners.clear();
    }
}

const runnerRegistry = new RunnerRegistry();
