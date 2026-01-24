// Launcher / Aiming Mechanics
const Launcher = {
    x: 0,
    y: 0,
    baseWidth: 160,
    baseHeight: 80,
    turretLength: 120,
    angle: -Math.PI / 4, // 45 degrees up
    power: 0,
    maxPower: 25,
    minPower: 5,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    currentVehicle: null,
    currentProjectile: null,
    trajectoryPoints: [],

    init(canvasWidth, canvasHeight) {
        // Position launcher at bottom left
        this.x = canvasWidth * 0.12;
        this.y = canvasHeight - 100; // Above ground
        this.currentVehicle = Vehicles.get('jeep');
        this.currentProjectile = Projectiles.get('standardMissile');
    },

    setVehicle(vehicleId) {
        this.currentVehicle = Vehicles.get(vehicleId);
    },

    setProjectile(projectileId) {
        this.currentProjectile = Projectiles.get(projectileId);
    },

    handlePointerDown(x, y) {
        // Check if clicking near launcher
        const dist = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
        if (dist < 150) {
            this.isDragging = true;
            this.dragStart = { x, y };
            return true;
        }
        return false;
    },

    handlePointerMove(x, y) {
        if (!this.isDragging) return;

        // Calculate angle and power based on drag
        const dx = this.dragStart.x - x;
        const dy = this.dragStart.y - y;

        // Angle (pointing away from drag direction)
        this.angle = Math.atan2(dy, dx);

        // Clamp angle to ONLY forward-facing directions (no backwards shooting)
        // Range: 0 (horizontal right) to -PI/2 (straight up) - never past vertical
        // This prevents the turret from ever pointing backwards (left)
        if (this.angle > 0) this.angle = 0;  // Don't point below horizontal
        if (this.angle < -Math.PI / 2) this.angle = -Math.PI / 2;  // Don't point past vertical

        // Power based on drag distance
        const dragDist = Math.sqrt(dx * dx + dy * dy);
        this.power = Math.min(dragDist / 10, this.maxPower);
        this.power = Math.max(this.power, this.minPower);

        // Calculate trajectory prediction
        this.calculateTrajectory();
    },

    handlePointerUp() {
        if (!this.isDragging) return null;

        this.isDragging = false;

        if (this.power < this.minPower) {
            this.trajectoryPoints = [];
            return null;
        }

        // Calculate launch velocity
        const launchData = this.getLaunchData();
        this.trajectoryPoints = [];

        return launchData;
    },

    getLaunchData() {
        const turretEndX = this.x + Math.cos(this.angle) * this.turretLength;
        const turretEndY = this.y + Math.sin(this.angle) * this.turretLength;

        // Apply vehicle and projectile modifiers
        const vehiclePower = this.currentVehicle.powerMultiplier || 1;
        const projectileSpeed = this.currentProjectile.speedMultiplier || 1;
        const speedBonus = this.currentVehicle.speedBonus || 1;

        const totalPower = this.power * vehiclePower * projectileSpeed * speedBonus;

        const velocityX = Math.cos(this.angle) * totalPower;
        const velocityY = Math.sin(this.angle) * totalPower;

        return {
            x: turretEndX,
            y: turretEndY,
            velocityX,
            velocityY,
            projectile: { ...this.currentProjectile }
        };
    },

    calculateTrajectory() {
        const launchData = this.getLaunchData();
        this.trajectoryPoints = [];

        let x = launchData.x;
        let y = launchData.y;
        let vx = launchData.velocityX;
        let vy = launchData.velocityY;

        const gravity = Physics.gravity.y * 0.001; // Scale gravity for trajectory
        const dt = 16; // Time step in ms
        const steps = 30; // Number of trajectory points

        for (let i = 0; i < steps; i++) {
            this.trajectoryPoints.push({ x, y });

            // Update position
            x += vx * dt / 16;
            y += vy * dt / 16;

            // Apply gravity
            vy += gravity * dt * 60;

            // Stop if off screen or below ground
            if (y > Physics.height - 50 || x > Physics.width || x < 0) {
                break;
            }
        }
    },

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw vehicle base
        this.drawVehicle(ctx);

        // Draw turret
        this.drawTurret(ctx);

        ctx.restore();

        // Draw trajectory when aiming
        if (this.isDragging && this.trajectoryPoints.length > 0) {
            this.drawTrajectory(ctx);
        }

        // Draw power indicator when dragging
        if (this.isDragging) {
            this.drawPowerIndicator(ctx);
        }
    },

    drawVehicle(ctx) {
        const vehicle = this.currentVehicle;

        // Draw different vehicle based on type
        switch (vehicle.id) {
            case 'jeep':
                this.drawJeep(ctx);
                break;
            case 'tank':
                this.drawTank(ctx);
                break;
            case 'rocketTruck':
                this.drawRocketTruck(ctx);
                break;
            case 'artillery':
                this.drawArtillery(ctx);
                break;
            default:
                this.drawJeep(ctx);
        }
    },

    // Army Jeep - Classic open-top military jeep
    drawJeep(ctx) {
        const w = this.baseWidth;
        const h = this.baseHeight;

        // Main body (olive drab)
        ctx.fillStyle = '#556B2F';
        ctx.beginPath();
        ctx.moveTo(-w/2 + 10, -h/3);
        ctx.lineTo(-w/2 + 20, -h/2);
        ctx.lineTo(w/2 - 10, -h/2);
        ctx.lineTo(w/2, -h/3);
        ctx.lineTo(w/2, h/4);
        ctx.lineTo(-w/2, h/4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3d4d23';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Windshield frame
        ctx.fillStyle = '#3d4d23';
        ctx.fillRect(-w/4, -h/2 - 5, w/2.5, 8);
        ctx.fillRect(-w/4, -h/2 - 5, 6, 35);
        ctx.fillRect(w/4 - 20, -h/2 - 5, 6, 35);

        // Hood
        ctx.fillStyle = '#4a5d27';
        ctx.fillRect(-w/2 + 15, -h/3, w/3, h/2);

        // Grille
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(-w/2 + 5, -h/4, 12, h/3);
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-w/2 + 7, -h/4 + 5 + i * 8, 8, 3);
        }

        // Headlights
        ctx.fillStyle = '#F4D03F';
        ctx.beginPath();
        ctx.arc(-w/2 + 10, -h/3 - 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Seats
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(-5, -h/4, 40, 25);
        ctx.fillRect(-5, -h/4 - 15, 40, 8);

        // Wheels (large off-road tires)
        this.drawWheel(ctx, -w/3, h/2 - 5, 28);
        this.drawWheel(ctx, w/3 - 5, h/2 - 5, 28);

        // Star emblem
        ctx.fillStyle = '#FFFFFF';
        this.drawStar(ctx, w/4, -h/4, 12);
    },

    // Tank - Heavy armored vehicle with tracks
    drawTank(ctx) {
        const w = this.baseWidth * 1.1;
        const h = this.baseHeight;

        // Tank tracks (bottom)
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.roundRect(-w/2, h/6, w, h/3, 15);
        ctx.fill();
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Track details (wheels inside track)
        ctx.fillStyle = '#1a1a1a';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-w/2 + 20 + i * (w-40)/4, h/3, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#4a4a4a';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-w/2 + 20 + i * (w-40)/4, h/3, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Track pattern
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.moveTo(-w/2 + 10 + i * 14, h/6 + 3);
            ctx.lineTo(-w/2 + 10 + i * 14, h/2 - 3);
            ctx.stroke();
        }

        // Hull (lower body)
        ctx.fillStyle = '#4A5D23';
        ctx.beginPath();
        ctx.moveTo(-w/2 + 5, h/6);
        ctx.lineTo(-w/2 + 15, -h/4);
        ctx.lineTo(w/2 - 15, -h/4);
        ctx.lineTo(w/2 - 5, h/6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3d4d1a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Turret base
        ctx.fillStyle = '#3d4d1a';
        ctx.beginPath();
        ctx.roundRect(-w/4, -h/2, w/2, h/4 + 5, 8);
        ctx.fill();
        ctx.strokeStyle = '#2d3d10';
        ctx.stroke();

        // Turret top hatch
        ctx.fillStyle = '#2d3d10';
        ctx.beginPath();
        ctx.arc(0, -h/2 + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a2a08';
        ctx.beginPath();
        ctx.arc(0, -h/2 + 15, 8, 0, Math.PI * 2);
        ctx.fill();

        // Armor plates detail
        ctx.strokeStyle = '#2d3d10';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w/3, -h/6);
        ctx.lineTo(-w/3, h/8);
        ctx.moveTo(w/3, -h/6);
        ctx.lineTo(w/3, h/8);
        ctx.stroke();
    },

    // Rocket Truck - Military truck with rocket launcher
    drawRocketTruck(ctx) {
        const w = this.baseWidth * 1.15;
        const h = this.baseHeight;

        // Truck bed (back)
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(0, -h/3, w/2 - 10, h/2 + 10);
        ctx.strokeStyle = '#4a3015';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Bed rails
        ctx.fillStyle = '#4a3015';
        ctx.fillRect(0, -h/3, 5, h/2 + 10);
        ctx.fillRect(w/2 - 15, -h/3, 5, h/2 + 10);

        // Rocket rack on bed
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(10, -h/2 + 5, w/2 - 30, 15);
        ctx.fillRect(10, -h/2 + 5, 8, h/3);
        ctx.fillRect(w/2 - 28, -h/2 + 5, 8, h/3);

        // Rockets in rack
        ctx.fillStyle = '#8B0000';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.roundRect(20 + i * 20, -h/2 + 8, 12, 40, 3);
            ctx.fill();
            // Rocket tips
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(26 + i * 20, -h/2 + 8);
            ctx.lineTo(20 + i * 20, -h/2 + 20);
            ctx.lineTo(32 + i * 20, -h/2 + 20);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#8B0000';
        }

        // Truck cab
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(-w/2 + 10, h/4);
        ctx.lineTo(-w/2 + 10, -h/3);
        ctx.lineTo(-w/2 + 30, -h/2);
        ctx.lineTo(5, -h/2);
        ctx.lineTo(5, h/4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5a0000';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Cab window
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.moveTo(-w/2 + 35, -h/2 + 5);
        ctx.lineTo(-w/2 + 25, -h/3);
        ctx.lineTo(0, -h/3);
        ctx.lineTo(0, -h/2 + 5);
        ctx.closePath();
        ctx.fill();

        // Headlight
        ctx.fillStyle = '#F4D03F';
        ctx.beginPath();
        ctx.arc(-w/2 + 15, -h/4, 8, 0, Math.PI * 2);
        ctx.fill();

        // Wheels (6 wheels - dual rear)
        this.drawWheel(ctx, -w/3, h/2 - 5, 25);
        this.drawWheel(ctx, w/4 - 10, h/2 - 5, 22);
        this.drawWheel(ctx, w/4 + 15, h/2 - 5, 22);
    },

    // Artillery Cannon - Massive towed artillery piece
    drawArtillery(ctx) {
        const w = this.baseWidth * 1.2;
        const h = this.baseHeight;

        // Base platform
        ctx.fillStyle = '#2F4F4F';
        ctx.beginPath();
        ctx.roundRect(-w/2 + 20, 0, w - 40, h/3, 5);
        ctx.fill();
        ctx.strokeStyle = '#1a3030';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Support struts
        ctx.fillStyle = '#1a3030';
        ctx.beginPath();
        ctx.moveTo(-w/2 + 30, h/3);
        ctx.lineTo(-w/2 + 10, h/2 + 10);
        ctx.lineTo(-w/2 + 40, h/2 + 10);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w/2 - 30, h/3);
        ctx.lineTo(w/2 - 10, h/2 + 10);
        ctx.lineTo(w/2 - 40, h/2 + 10);
        ctx.closePath();
        ctx.fill();

        // Main cannon housing
        ctx.fillStyle = '#3F5F5F';
        ctx.beginPath();
        ctx.roundRect(-w/4, -h/2 + 10, w/2, h/2, 10);
        ctx.fill();
        ctx.strokeStyle = '#2a4040';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Cannon elevation mechanism
        ctx.fillStyle = '#2a4040';
        ctx.beginPath();
        ctx.arc(0, -h/4, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a3030';
        ctx.beginPath();
        ctx.arc(0, -h/4, 15, 0, Math.PI * 2);
        ctx.fill();

        // Ammo storage boxes
        ctx.fillStyle = '#4a6a4a';
        ctx.fillRect(-w/2 + 25, -h/4, 25, 30);
        ctx.fillRect(w/2 - 50, -h/4, 25, 30);
        ctx.fillStyle = '#3a5a3a';
        ctx.fillRect(-w/2 + 27, -h/4 + 2, 21, 10);
        ctx.fillRect(w/2 - 48, -h/4 + 2, 21, 10);

        // Sights
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-5, -h/2, 10, 15);
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(0, -h/2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Large wheels
        this.drawWheel(ctx, -w/3 + 10, h/2, 32);
        this.drawWheel(ctx, w/3 - 10, h/2, 32);
    },

    // Helper: Draw a detailed wheel
    drawWheel(ctx, x, y, radius) {
        // Tire
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Tire tread pattern
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * (radius - 5), y + Math.sin(angle) * (radius - 5));
            ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            ctx.stroke();
        }

        // Rim
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Hub
        ctx.fillStyle = '#6a6a6a';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Hub bolts
        ctx.fillStyle = '#3a3a3a';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(x + Math.cos(angle) * radius * 0.2, y + Math.sin(angle) * radius * 0.2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // Helper: Draw a star
    drawStar(ctx, x, y, radius) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    },

    drawTurret(ctx) {
        ctx.save();
        ctx.rotate(this.angle);

        // Turret barrel
        const gradient = ctx.createLinearGradient(0, -18, 0, 18);
        gradient.addColorStop(0, '#5a6268');
        gradient.addColorStop(0.3, '#7F8C8D');
        gradient.addColorStop(0.5, '#95A5A6');
        gradient.addColorStop(0.7, '#7F8C8D');
        gradient.addColorStop(1, '#5a6268');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, -18, this.turretLength, 36, 6);
        ctx.fill();

        // Barrel border
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Barrel end (muzzle)
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.roundRect(this.turretLength - 10, -22, 20, 44, 4);
        ctx.fill();

        // Muzzle hole
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(this.turretLength, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Current ammo preview
        if (this.currentProjectile.emoji) {
            ctx.font = '35px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.currentProjectile.emoji, this.turretLength + 30, 0);
        }

        ctx.restore();
    },

    drawTrajectory(ctx) {
        ctx.save();

        for (let i = 0; i < this.trajectoryPoints.length; i++) {
            const point = this.trajectoryPoints[i];
            const alpha = 1 - (i / this.trajectoryPoints.length);
            const size = 4 + (1 - i / this.trajectoryPoints.length) * 4;

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    drawPowerIndicator(ctx) {
        const barWidth = 200;
        const barHeight = 25;
        const x = this.x - barWidth / 2;
        const y = this.y + 70;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 8);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Power fill
        const powerPercent = this.power / this.maxPower;
        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
        gradient.addColorStop(0, '#00B894');
        gradient.addColorStop(0.5, '#FDCB6E');
        gradient.addColorStop(1, '#E17055');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, (barWidth - 6) * powerPercent, barHeight - 6, 5);
        ctx.fill();

        // Power text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`POWER: ${Math.round(powerPercent * 100)}%`, this.x, y + barHeight / 2);
    },

    resize(canvasWidth, canvasHeight) {
        this.x = canvasWidth * 0.12;
        this.y = canvasHeight - 100;
    }
};
