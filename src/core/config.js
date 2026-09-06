const GameConfig = {
    graphics: {
        antialias: true,
        powerPreference: 'high-performance',
        shadows: true,
        shadowResolution: 2048
    },
    
    city: {
        blockSize: 20,
        streetWidth: 4,
        buildingHeightMin: 10,
        buildingHeightMax: 40,
        districtSize: 5,
        numDistricts: 9
    },
    
    player: {
        moveSpeed: 5.0,
        sprintSpeed: 10.0,
        mouseSensitivity: 0.2,
        height: 1.8,
        interactionDistance: 3.0
    },
    
    lighting: {
        dayDuration: 240,
        dayColor: new pc.Color(1.0, 0.95, 0.8),
        nightColor: new pc.Color(0.1, 0.1, 0.2),
        sunIntensity: 1.2,
        ambientIntensity: 0.3
    },
    
    districts: [
        { id: 'downtown', name: 'Downtown District', position: { x: 0, z: 0 }, type: 'commercial' },
        { id: 'residential-north', name: 'Residential North', position: { x: 0, z: 120 }, type: 'residential' },
        { id: 'residential-south', name: 'Residential South', position: { x: 0, z: -120 }, type: 'residential' },
        { id: 'tech-hub', name: 'Tech Hub', position: { x: 120, z: 0 }, type: 'tech' },
        { id: 'industrial', name: 'Industrial Zone', position: { x: -120, z: 0 }, type: 'industrial' },
        { id: 'startup-alley', name: 'Startup Alley', position: { x: 120, z: 120 }, type: 'startup' },
        { id: 'corporate-park', name: 'Corporate Park', position: { x: -120, z: 120 }, type: 'corporate' },
        { id: 'creative-quarter', name: 'Creative Quarter', position: { x: 120, z: -120 }, type: 'creative' },
        { id: 'dev-district', name: 'Dev District', position: { x: -120, z: -120 }, type: 'dev' }
    ],
    
    colors: {
        commercial: new pc.Color(0.3, 0.6, 0.8),
        residential: new pc.Color(0.6, 0.8, 0.4),
        tech: new pc.Color(0.5, 0.3, 0.8),
        industrial: new pc.Color(0.5, 0.5, 0.5),
        startup: new pc.Color(0.9, 0.5, 0.3),
        corporate: new pc.Color(0.2, 0.4, 0.6),
        creative: new pc.Color(0.9, 0.3, 0.6),
        dev: new pc.Color(0.3, 0.8, 0.5),
        street: new pc.Color(0.2, 0.2, 0.2),
        ground: new pc.Color(0.15, 0.3, 0.15)
    },
    
    buildingKinds: {
        home: {
            color: new pc.Color(0.72, 0.58, 0.42),
            accentColor: new pc.Color(0.52, 0.35, 0.22),
            baseScale: { x: 14, y: 9, z: 11 },
            roofType: 'pitched',
            windowDensity: 0.4
        },
        cafe: {
            color: new pc.Color(0.5, 0.35, 0.25),
            accentColor: new pc.Color(0.8, 0.6, 0.4),
            baseScale: { x: 10, y: 8, z: 10 },
            roofType: 'flat',
            windowDensity: 0.7
        },
        cowork: {
            color: new pc.Color(0.4, 0.5, 0.6),
            accentColor: new pc.Color(0.5, 0.7, 0.9),
            baseScale: { x: 15, y: 12, z: 15 },
            roofType: 'flat',
            windowDensity: 0.8
        },
        office: {
            color: new pc.Color(0.35, 0.4, 0.45),
            accentColor: new pc.Color(0.5, 0.6, 0.7),
            baseScale: { x: 18, y: 25, z: 18 },
            roofType: 'flat',
            windowDensity: 0.9
        },
        campus: {
            color: new pc.Color(0.45, 0.5, 0.55),
            accentColor: new pc.Color(0.6, 0.7, 0.8),
            baseScale: { x: 30, y: 20, z: 30 },
            roofType: 'flat',
            windowDensity: 0.85
        },
        serverRoom: {
            color: new pc.Color(0.3, 0.3, 0.35),
            accentColor: new pc.Color(0.4, 0.5, 0.6),
            baseScale: { x: 12, y: 10, z: 12 },
            roofType: 'flat',
            windowDensity: 0.2
        },
        agency: {
            color: new pc.Color(0.45, 0.4, 0.5),
            accentColor: new pc.Color(0.6, 0.5, 0.7),
            baseScale: { x: 16, y: 18, z: 16 },
            roofType: 'flat',
            windowDensity: 0.75
        }
    }
};
