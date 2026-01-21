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

        // Clamp angle to reasonable range (0 to -PI, which is 0 to 180 degrees above horizontal)
        if (this.angle > 0) this.angle = 0;
        if (this.angle < -Math.PI) this.angle = -Math.PI;

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

        // Vehicle body
        ctx.fillStyle = vehicle.color;
        ctx.beginPath();
        ctx.roundRect(-this.baseWidth / 2, -this.baseHeight / 2, this.baseWidth, this.baseHeight, 15);
        ctx.fill();

        // Vehicle border
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Vehicle highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(-this.baseWidth / 2 + 10, -this.baseHeight / 2 + 10, this.baseWidth - 20, this.baseHeight / 3);

        // Wheels
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(-this.baseWidth / 3, this.baseHeight / 2 - 5, 25, 0, Math.PI * 2);
        ctx.arc(this.baseWidth / 3, this.baseHeight / 2 - 5, 25, 0, Math.PI * 2);
        ctx.fill();

        // Wheel border
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Wheel detail
        ctx.fillStyle = '#7F8C8D';
        ctx.beginPath();
        ctx.arc(-this.baseWidth / 3, this.baseHeight / 2 - 5, 12, 0, Math.PI * 2);
        ctx.arc(this.baseWidth / 3, this.baseHeight / 2 - 5, 12, 0, Math.PI * 2);
        ctx.fill();

        // Vehicle emoji
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vehicle.emoji, 0, -10);
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
