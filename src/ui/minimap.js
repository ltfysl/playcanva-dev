class Minimap {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scale = 1.0;
        this.mapSize = 400;
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        this.canvas.width = 200;
        this.canvas.height = 200;
    }
    
    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawDistricts();
        this.drawBuildings();
        this.drawPlayer();
    }
    
    drawDistricts() {
        const districts = this.gameManager.districts;
        
        districts.forEach(district => {
            const screenPos = this.worldToScreen(district.position.x, district.position.z);
            const districtSize = GameConfig.city.districtSize * GameConfig.city.blockSize;
            const screenSize = districtSize / this.scale;
            
            const color = GameConfig.colors[district.type];
            this.ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.15)`;
            this.ctx.fillRect(
                screenPos.x - screenSize / 2,
                screenPos.y - screenSize / 2,
                screenSize,
                screenSize
            );
            
            this.ctx.strokeStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.4)`;
            this.ctx.lineWidth = 0.5;
            this.ctx.strokeRect(
                screenPos.x - screenSize / 2,
                screenPos.y - screenSize / 2,
                screenSize,
                screenSize
            );
        });
    }
    
    drawBuildings() {
        const buildings = this.gameManager.buildings;
        
        buildings.forEach(building => {
            if (!building.position) return;
            
            const screenPos = this.worldToScreen(building.position.x, building.position.z);
            
            if (building.canEnter) {
                const kindColors = {
                    'home': [255, 180, 120],
                    'cafe': [200, 140, 100],
                    'cowork': [120, 180, 230],
                    'office': [150, 170, 190],
                    'campus': [180, 200, 220],
                    'serverRoom': [120, 140, 160],
                    'agency': [180, 150, 200]
                };
                
                const color = kindColors[building.kind] || [180, 180, 180];
                
                this.ctx.shadowBlur = 6;
                this.ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.6)`;
                
                this.ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`;
                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.shadowBlur = 0;
                
                this.ctx.strokeStyle = `rgba(${color[0] + 30}, ${color[1] + 30}, ${color[2] + 30}, 1.0)`;
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            }
        });
    }
    
    drawPlayer() {
        if (!this.gameManager.player) return;
        
        const playerPos = this.gameManager.player.getPosition();
        const screenPos = this.worldToScreen(playerPos.x, playerPos.z);
        
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'rgba(255, 230, 100, 0.8)';
        
        this.ctx.fillStyle = 'rgba(255, 240, 120, 1.0)';
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, 4.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 180, 1.0)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        const rotation = this.gameManager.player.rotation.y * pc.math.DEG_TO_RAD;
        const dirLength = 10;
        const dirX = Math.sin(rotation) * dirLength;
        const dirY = -Math.cos(rotation) * dirLength;
        
        this.ctx.strokeStyle = 'rgba(255, 240, 120, 0.9)';
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x, screenPos.y);
        this.ctx.lineTo(screenPos.x + dirX, screenPos.y + dirY);
        this.ctx.stroke();
    }
    
    worldToScreen(worldX, worldZ) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const playerPos = this.gameManager.player.getPosition();
        
        const relX = worldX - playerPos.x;
        const relZ = worldZ - playerPos.z;
        
        const screenX = centerX + (relX / this.scale);
        const screenY = centerY + (relZ / this.scale);
        
        return { x: screenX, y: screenY };
    }
    
    setScale(scale) {
        this.scale = scale;
    }
}
