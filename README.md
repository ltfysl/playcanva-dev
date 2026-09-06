# Dev Tycoon

A premium developer-life / career / freelance / SaaS / open-city simulation built with PlayCanvas.

## Current Features (City Hub Foundation - v0.1)

### Core Systems
- **Player Locomotion**: WASD movement, mouse-look camera, sprint (Shift)
- **City Hub**: 9 distinct districts with procedural layout
- **Building System**: Distinct silhouettes by kind (home, cafe, cowork, office, campus, server room, agency)
- **Enterable Buildings**: Your starter apartment with fully furnished interior
- **Day/Night Cycle**: Dynamic lighting with warm daylight key + cool fill
- **Minimap**: Bottom-right panel showing districts, buildings by kind, player position with facing indicator

### Wren Data Contracts (Implemented)
- **LocationId**: District + building identifier system
- **BuildingKind**: Typed building categories (home, cafe, cowork, office, campus, serverRoom, agency, etc.)
- **Presence**: Player location tracking with enter/exit events
- **ActivitySlot[]**: Typed activity slots with skill tags (empty arrays, ready for Skills module)
- **UnlockState**: Per-location lock state (locked | available | owned)
- **ReputationSurface**: District reputation hooks (ready for Career module)

### Visual Quality (Sol Standards)
- Distinct building silhouettes and colors per building kind
- Ground plane with soft AO shadows under buildings
- Daylight key + cool fill lighting (no harsh white albedo)
- Clear door/porch threshold for building entry
- Warm interior vs cooler exterior contrast
- Focal surface (desk wall) in home interior for future UI
- Commercial-grade minimap with rounded panel, kind-color dots, and legible layout

## How to Run

### Option 1: Direct Browser (Recommended for Testing)

1. **Open in Browser**:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   
   # Or using PHP
   php -S localhost:8000
   ```

2. **Navigate**: Open `http://localhost:8000` in your browser

3. **Play**:
   - Click the canvas to lock cursor
   - **WASD**: Move around the city
   - **Mouse**: Look around
   - **Shift**: Sprint
   - **E**: Enter/Exit buildings (approach the door of Your Apartment)
   - **ESC**: Release cursor

### Option 2: PlayCanvas Editor (For Development)

1. **Create New Project** on [playcanvas.com](https://playcanvas.com)

2. **Upload Project Files**:
   - Upload `index.html` as your main HTML file
   - Upload all files from `src/` directory maintaining the folder structure:
     - `src/core/` - Configuration and game management
     - `src/player/` - Player controller
     - `src/city/` - City generation and districts
     - `src/buildings/` - Building and interior systems
     - `src/systems/` - Lighting system
     - `src/ui/` - Minimap

3. **Set as Launch Scene**: Configure the project to use `index.html` as the entry point

4. **Launch**: Use PlayCanvas Editor's play button or publish

### Option 3: Static Hosting

Deploy to any static host:
- **Netlify**: Drag the entire project folder
- **Vercel**: `vercel deploy`
- **GitHub Pages**: Push to `gh-pages` branch
- **Cloudflare Pages**: Connect repository

## Project Structure

```
playcanva-dev/
├── index.html                 # Main entry point
├── src/
│   ├── core/
│   │   ├── config.js         # Game configuration and constants
│   │   ├── city-module.js    # Wren data contracts (LocationId, Presence, ActivitySlot, etc.)
│   │   └── game-manager.js   # Central game coordination
│   ├── player/
│   │   └── player-controller.js  # First-person movement and camera
│   ├── city/
│   │   ├── city-generator.js     # City and building generation
│   │   └── district.js           # District creation and management
│   ├── buildings/
│   │   ├── building.js           # Building class with distinct kinds
│   │   └── home-interior.js      # Apartment interior with furniture
│   ├── systems/
│   │   └── lighting-system.js    # Day/night cycle and lighting
│   └── ui/
│       └── minimap.js            # Minimap rendering
└── README.md
```

## Controls

| Input | Action |
|-------|--------|
| **W/A/S/D** | Move forward/left/backward/right |
| **Mouse** | Look around (cursor must be locked) |
| **Shift** | Sprint (2x speed) |
| **E** | Enter/Exit buildings |
| **Click Canvas** | Lock cursor for mouse look |
| **ESC** | Release cursor |

## Current Locations

### Downtown District
- **Your Apartment** (Enterable, Owned): Starter home with desk, bed, bookshelf, and focal wall for future UI
- **The Bean Café** (Available): Coffee shop placeholder
- **Hub Cowork** (Locked): Coworking space placeholder

### Other Districts (Placeholders)
- Residential North, Residential South
- Tech Hub, Industrial Zone
- Startup Alley, Corporate Park
- Creative Quarter, Dev District

## Architecture Notes

### Module Boundaries
- **City Module** (`src/core/city-module.js`): Pure data layer, no rendering coupling
- **Building System**: Supports different kinds with distinct visuals
- **Activity System**: Typed slots ready for Skills module integration
- **Performance**: LOD/culling-ready structure, instancing for repeated elements

### Future Integration Points
- **Skills System**: Hook into `ActivitySlot.skillTags[]`
- **Career System**: Hook into `ReputationSurface` and district visibility
- **Simulation**: Time-based events via `Presence` enter/exit listeners
- **UI**: Focal surface in home interior ready for modal/panel overlays

## Technical Details

- **Engine**: PlayCanvas (latest stable, loaded from CDN)
- **Rendering**: WebGL 2.0 with shadow mapping
- **Performance**: 
  - Shadow resolution: 2048
  - Fog culling: 50-300 units
  - Instanced materials where possible
- **Lighting**: 
  - Directional sun with shadows
  - Cool fill light for depth
  - Dynamic day/night cycle
  - Interior point lights with warm tones

## Development

### Adding New Buildings

```javascript
// In src/city/city-generator.js
const building = new Building(
    this.app,
    this.gameManager,
    'building-id',
    'Building Name',
    new pc.Vec3(x, 0, z),
    'cafe',  // BuildingKind: home, cafe, cowork, office, campus, serverRoom, agency
    UnlockState.AVAILABLE
);

// Register with city module
const locationId = new LocationId('district-id', 'building-id');
const locationData = new LocationData(locationId, BuildingKind.CAFE, {
    name: 'Building Name',
    unlockState: UnlockState.AVAILABLE,
    position: new pc.Vec3(x, 0, z),
    activitySlots: [
        new ActivitySlot('activity-id', {
            name: 'Activity Name',
            skillTags: [],  // Ready for Skills module
            durationHint: 60
        })
    ]
});
this.cityModule.registerLocation(locationData);
```

### Extending Activity Slots

Activity slots are typed and ready for future integration:

```javascript
new ActivitySlot('deep-work', {
    name: 'Deep Work Session',
    skillTags: ['coding', 'focus'],  // Future: XP gain
    unlockRule: null,  // Future: progression gates
    durationHint: 120  // Minutes
})
```

## Status

✅ **Complete**: City hub foundation, player locomotion, building system, lighting, minimap  
🚧 **Next**: Skills system, Career progression, full interiors, simulation loop

---

**Repository**: `ltfysl/playcanva-dev`  
**First Slice**: City Hub Foundation (PR#1)
