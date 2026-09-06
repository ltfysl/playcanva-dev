pc.WasmModule.setConfig('Ammo', {
    glueUrl: 'lib/ammo/ammo.wasm.js',
    wasmUrl: 'lib/ammo/ammo.wasm.wasm'
});

pc.WasmModule.getInstance('Ammo', function(ammo) {
    window.Ammo = ammo;
    
    const canvas = document.getElementById('application-canvas');

    const app = new pc.Application(canvas, {
        mouse: new pc.Mouse(canvas),
        keyboard: new pc.Keyboard(window),
        graphicsDeviceOptions: GameConfig.graphics
    });

    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    window.addEventListener('resize', () => {
        app.resizeCanvas();
    });

    app.scene.gammaCorrection = pc.GAMMA_SRGB;
    app.scene.toneMapping = pc.TONEMAP_ACES;

    const gameManager = new GameManager(app);

    app.on('start', () => {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        console.log('Dev Tycoon - City Hub initialized');
        console.log('Ammo physics ready:', typeof Ammo !== 'undefined');
        console.log('Click to lock cursor, WASD to move, E to interact');
    });

    app.start();

    gameManager.initialize();

    app.on('update', (dt) => {
        gameManager.update(dt);
    });

    window.app = app;
    window.gameManager = gameManager;
});
