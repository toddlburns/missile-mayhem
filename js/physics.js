// Physics Engine Setup using Matter.js
const Physics = {
    engine: null,
    world: null,
    render: null,
    runner: null,
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    gravity: { x: 0, y: 1 },
    bodies: [],
    projectiles: [],
    targets: [],
    ground: null,
    walls: [],

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Create Matter.js engine
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        // Set gravity
        this.engine.world.gravity.x = this.gravity.x;
        this.engine.world.gravity.y = this.gravity.y;

        // Create boundaries
        this.createBoundaries();

        // Set up collision events
        this.setupCollisions();

        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Recreate boundaries on resize
        if (this.world) {
            this.createBoundaries();
        }
    },

    createBoundaries() {
        // Remove old boundaries
        if (this.ground) Matter.World.remove(this.world, this.ground);
        this.walls.forEach(wall => Matter.World.remove(this.world, wall));
        this.walls = [];

        const thickness = 100;
        const groundHeight = 50;

        // Ground
        this.ground = Matter.Bodies.rectangle(
            this.width / 2,
            this.height - groundHeight / 2,
            this.width * 2,
            groundHeight,
            { isStatic: true, label: 'ground', friction: 0.8 }
        );

        // Left wall (invisible, just to catch projectiles)
        const leftWall = Matter.Bodies.rectangle(
            -thickness / 2,
            this.height / 2,
            thickness,
            this.height * 2,
            { isStatic: true, label: 'wall' }
        );

        // Right wall
        const rightWall = Matter.Bodies.rectangle(
            this.width + thickness / 2,
            this.height / 2,
            thickness,
            this.height * 2,
            { isStatic: true, label: 'wall' }
        );

        this.walls = [leftWall, rightWall];

        Matter.World.add(this.world, [this.ground, ...this.walls]);
    },

    setupCollisions() {
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                // Check if projectile hit target
                const projectile = this.getProjectileBody(bodyA) || this.getProjectileBody(bodyB);
                const target = this.getTargetBody(bodyA) || this.getTargetBody(bodyB);

                if (projectile && target) {
                    this.handleProjectileHit(projectile, target, pair);
                }

                // Check for bouncy projectiles hitting ground
                if (projectile && (bodyA.label === 'ground' || bodyB.label === 'ground')) {
                    this.handleGroundHit(projectile);
                }
            });
        });
    },

    getProjectileBody(body) {
        return this.projectiles.find(p => p.body === body || p.body.id === body.id);
    },

    getTargetBody(body) {
        return this.targets.find(t => t.body === body || t.body.id === body.id);
    },

    handleProjectileHit(projectile, target, pair) {
        // Create impact effect
        if (Game && Game.createImpactEffect) {
            Game.createImpactEffect(pair.collision.supports[0] || target.body.position);
        }

        // Any hit destroys the target immediately!
        this.destroyTarget(target);

        // Handle special projectile behaviors
        if (projectile.data?.onHit) {
            projectile.data.onHit(projectile, target, this);
        }
    },

    handleGroundHit(projectile) {
        if (projectile.data?.bounces && projectile.data.bounces > 0) {
            projectile.data.bounces--;
            // Bounce effect is handled by Matter.js restitution
        } else if (projectile.data?.onGroundHit) {
            projectile.data.onGroundHit(projectile, this);
        }
    },

    destroyTarget(target) {
        // Trigger destruction callback
        if (Game && Game.onTargetDestroyed) {
            Game.onTargetDestroyed(target);
        }

        // Remove from physics world
        Matter.World.remove(this.world, target.body);

        // Remove from targets array
        const index = this.targets.indexOf(target);
        if (index > -1) {
            this.targets.splice(index, 1);
        }
    },

    addProjectile(x, y, velocityX, velocityY, projectileData) {
        const size = projectileData.size || 15;
        const options = {
            restitution: projectileData.restitution || 0.3,
            friction: projectileData.friction || 0.1,
            density: projectileData.density || 0.001,
            label: 'projectile',
            collisionFilter: {
                category: 0x0002,
                mask: 0x0001 | 0x0004
            }
        };

        let body;
        if (projectileData.shape === 'circle') {
            body = Matter.Bodies.circle(x, y, size, options);
        } else {
            body = Matter.Bodies.rectangle(x, y, size * 2, size, options);
        }

        Matter.Body.setVelocity(body, { x: velocityX, y: velocityY });
        Matter.World.add(this.world, body);

        const projectile = {
            body,
            data: projectileData,
            createdAt: Date.now()
        };

        this.projectiles.push(projectile);
        return projectile;
    },

    addTarget(x, y, width, height, targetData) {
        const options = {
            restitution: targetData.restitution || 0.2,
            friction: targetData.friction || 0.5,
            density: targetData.density || 0.002,
            label: 'target',
            collisionFilter: {
                category: 0x0004,
                mask: 0x0001 | 0x0002 | 0x0004
            }
        };

        let body;
        if (targetData.shape === 'circle') {
            body = Matter.Bodies.circle(x, y, width / 2, options);
        } else {
            body = Matter.Bodies.rectangle(x, y, width, height, options);
        }

        if (targetData.isStatic) {
            Matter.Body.setStatic(body, true);
        }

        Matter.World.add(this.world, body);

        const target = {
            body,
            data: targetData,
            health: targetData.health || 100,
            maxHealth: targetData.health || 100,
            points: targetData.points || 10,
            hitCount: 0
        };

        this.targets.push(target);
        return target;
    },

    addStaticBody(x, y, width, height, options = {}) {
        const body = Matter.Bodies.rectangle(x, y, width, height, {
            isStatic: true,
            label: options.label || 'static',
            friction: options.friction || 0.8,
            collisionFilter: {
                category: 0x0001,
                mask: 0x0002 | 0x0004
            }
        });

        Matter.World.add(this.world, body);
        this.bodies.push({ body, data: options });
        return body;
    },

    setGravity(x, y) {
        this.gravity = { x, y };
        if (this.engine) {
            this.engine.world.gravity.x = x;
            this.engine.world.gravity.y = y;
        }
    },

    update(delta) {
        Matter.Engine.update(this.engine, delta);

        // Clean up off-screen projectiles
        this.projectiles = this.projectiles.filter(p => {
            const pos = p.body.position;
            if (pos.x < -100 || pos.x > this.width + 100 || pos.y > this.height + 100) {
                Matter.World.remove(this.world, p.body);
                return false;
            }
            // Remove old projectiles (more than 10 seconds)
            if (Date.now() - p.createdAt > 10000) {
                Matter.World.remove(this.world, p.body);
                return false;
            }
            return true;
        });
    },

    clear() {
        // Remove all projectiles
        this.projectiles.forEach(p => Matter.World.remove(this.world, p.body));
        this.projectiles = [];

        // Remove all targets
        this.targets.forEach(t => Matter.World.remove(this.world, t.body));
        this.targets = [];

        // Remove additional bodies
        this.bodies.forEach(b => Matter.World.remove(this.world, b.body));
        this.bodies = [];
    },

    render(backgroundType) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this.drawBackground(backgroundType);

        // Draw back-layer decorations (behind obstacles)
        this.renderDecorations('back');

        // Draw ground
        this.drawGround(backgroundType);

        // Draw static bodies (platforms, etc.)
        this.bodies.forEach(b => this.drawBody(b.body, b.data));

        // Draw targets
        this.targets.forEach(t => this.drawTarget(t));

        // Draw projectiles
        this.projectiles.forEach(p => this.drawProjectile(p));

        // Draw front-layer decorations (in front of obstacles)
        this.renderDecorations('front');
    },

    drawBackground(type) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);

        switch (type) {
            case 'desert':
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.6, '#F4D03F');
                gradient.addColorStop(1, '#E67E22');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawDesertDecorations();
                break;
            case 'snow':
                gradient.addColorStop(0, '#A8D8EA');
                gradient.addColorStop(0.5, '#FFFFFF');
                gradient.addColorStop(1, '#D5DBDB');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawSnowDecorations();
                break;
            case 'moon':
                gradient.addColorStop(0, '#0C0C1E');
                gradient.addColorStop(0.5, '#1A1A3E');
                gradient.addColorStop(1, '#2C2C4E');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawStars();
                this.drawMoonDecorations();
                break;
            case 'city':
                gradient.addColorStop(0, '#1a1a2e');
                gradient.addColorStop(0.5, '#16213e');
                gradient.addColorStop(1, '#0f3460');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawCityDecorations();
                break;
            case 'jungle':
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.4, '#228B22');
                gradient.addColorStop(1, '#006400');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawJungleDecorations();
                break;
            default: // backyard
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#98D8C8');
                gradient.addColorStop(1, '#7BC043');
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawBackyardDecorations();
        }
    },

    // Backyard decorations - fence, trees, flowers, clouds
    drawBackyardDecorations() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const groundY = h - 50;

        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawCloud(w * 0.15, h * 0.12, 60);
        this.drawCloud(w * 0.45, h * 0.08, 80);
        this.drawCloud(w * 0.75, h * 0.15, 50);
        this.drawCloud(w * 0.9, h * 0.1, 40);

        // Sun
        ctx.fillStyle = '#FFD93D';
        ctx.beginPath();
        ctx.arc(w * 0.1, h * 0.1, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF3B0';
        ctx.beginPath();
        ctx.arc(w * 0.1, h * 0.1, 30, 0, Math.PI * 2);
        ctx.fill();

        // Background trees (far)
        this.drawTree(w * 0.02, groundY, 0.6, '#2d5a27');
        this.drawTree(w * 0.08, groundY, 0.8, '#3d6b37');

        // Wooden fence in background
        ctx.fillStyle = '#8B4513';
        for (let x = 0; x < w; x += 40) {
            // Fence posts
            ctx.fillRect(x, groundY - 80, 8, 80);
            // Horizontal rails
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(x - 5, groundY - 70, 50, 8);
            ctx.fillRect(x - 5, groundY - 40, 50, 8);
            ctx.fillStyle = '#8B4513';
        }

        // Flowers in foreground
        const flowerColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8ED4', '#95E1D3'];
        for (let i = 0; i < 15; i++) {
            const fx = (i * 67 + 20) % w;
            const fy = groundY - 5;
            this.drawFlower(fx, fy, flowerColors[i % flowerColors.length]);
        }

        // Bushes
        ctx.fillStyle = '#228B22';
        this.drawBush(w * 0.25, groundY - 10, 40);
        this.drawBush(w * 0.6, groundY - 10, 35);
    },

    // Desert decorations - cacti, rocks, tumbleweeds, distant mesas
    drawDesertDecorations() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const groundY = h - 50;

        // Sun
        ctx.fillStyle = '#FFD93D';
        ctx.beginPath();
        ctx.arc(w * 0.85, h * 0.1, 50, 0, Math.PI * 2);
        ctx.fill();

        // Distant mesas
        ctx.fillStyle = '#C9A66B';
        ctx.beginPath();
        ctx.moveTo(w * 0.6, groundY);
        ctx.lineTo(w * 0.65, groundY - 120);
        ctx.lineTo(w * 0.75, groundY - 120);
        ctx.lineTo(w * 0.8, groundY);
        ctx.fill();

        ctx.fillStyle = '#B8956B';
        ctx.beginPath();
        ctx.moveTo(w * 0.1, groundY);
        ctx.lineTo(w * 0.15, groundY - 80);
        ctx.lineTo(w * 0.25, groundY - 80);
        ctx.lineTo(w * 0.3, groundY);
        ctx.fill();

        // Cacti
        this.drawCactus(w * 0.05, groundY, 1.0);
        this.drawCactus(w * 0.18, groundY, 0.7);
        this.drawCactus(w * 0.88, groundY, 0.8);

        // Rocks
        ctx.fillStyle = '#8B7355';
        this.drawRock(w * 0.35, groundY, 25);
        this.drawRock(w * 0.55, groundY, 18);
        this.drawRock(w * 0.7, groundY, 30);

        // Tumbleweeds
        ctx.fillStyle = '#C4A35A';
        ctx.beginPath();
        ctx.arc(w * 0.4, groundY - 15, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#A08040';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Skull (desert ambiance)
        ctx.font = '30px Arial';
        ctx.fillText('💀', w * 0.15, groundY - 5);
    },

    // Snow decorations - pine trees, snowmen, icicles, mountains
    drawSnowDecorations() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const groundY = h - 50;

        // Distant mountains
        ctx.fillStyle = '#B0C4DE';
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w * 0.2, groundY - 200);
        ctx.lineTo(w * 0.4, groundY);
        ctx.fill();

        ctx.fillStyle = '#A8B9CC';
        ctx.beginPath();
        ctx.moveTo(w * 0.3, groundY);
        ctx.lineTo(w * 0.5, groundY - 250);
        ctx.lineTo(w * 0.7, groundY);
        ctx.fill();

        // Snow caps
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(w * 0.15, groundY - 160);
        ctx.lineTo(w * 0.2, groundY - 200);
        ctx.lineTo(w * 0.25, groundY - 160);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w * 0.45, groundY - 210);
        ctx.lineTo(w * 0.5, groundY - 250);
        ctx.lineTo(w * 0.55, groundY - 210);
        ctx.fill();

        // Pine trees
        this.drawPineTree(w * 0.08, groundY, 1.0);
        this.drawPineTree(w * 0.15, groundY, 0.7);
        this.drawPineTree(w * 0.85, groundY, 0.9);
        this.drawPineTree(w * 0.92, groundY, 0.6);

        // Snowman
        this.drawSnowman(w * 0.25, groundY);

        // Icicles hanging from top
        ctx.fillStyle = '#E0FFFF';
        for (let i = 0; i < 20; i++) {
            const ix = i * (w / 20) + 10;
            const ih = 15 + Math.sin(i) * 10;
            ctx.beginPath();
            ctx.moveTo(ix - 5, 0);
            ctx.lineTo(ix, ih);
            ctx.lineTo(ix + 5, 0);
            ctx.fill();
        }

        // Falling snowflakes
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const sx = ((i * 73 + Date.now() / 50) % w);
            const sy = ((i * 47 + Date.now() / 30) % (groundY - 20));
            ctx.beginPath();
            ctx.arc(sx, sy, 2 + (i % 3), 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // Moon decorations - craters, Earth in sky, astronaut flag, rocks
    drawMoonDecorations() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const groundY = h - 50;

        // Earth in the sky
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(w * 0.15, h * 0.2, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(w * 0.15 - 10, h * 0.2 - 5, 15, 0, Math.PI * 2);
        ctx.arc(w * 0.15 + 15, h * 0.2 + 10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(w * 0.15 - 15, h * 0.2 - 15, 8, 0, Math.PI * 2);
        ctx.fill();

        // Craters on ground
        ctx.fillStyle = '#3A3A5A';
        this.drawCrater(w * 0.3, groundY - 10, 40);
        this.drawCrater(w * 0.6, groundY - 5, 30);
        this.drawCrater(w * 0.8, groundY - 8, 25);

        // Moon rocks
        ctx.fillStyle = '#5A5A7A';
        this.drawRock(w * 0.1, groundY, 20);
        this.drawRock(w * 0.45, groundY, 15);
        this.drawRock(w * 0.75, groundY, 22);

        // American flag
        this.drawFlag(w * 0.2, groundY);

        // Astronaut footprints
        ctx.fillStyle = '#3A3A5A';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(w * 0.25 + i * 25, groundY - 3, 8, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // Helper drawing functions
    drawCloud(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    },

    drawTree(x, y, scale, color) {
        const ctx = this.ctx;
        const s = scale;
        // Trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 8 * s, y - 60 * s, 16 * s, 60 * s);
        // Foliage
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y - 80 * s, 40 * s, 0, Math.PI * 2);
        ctx.arc(x - 25 * s, y - 60 * s, 30 * s, 0, Math.PI * 2);
        ctx.arc(x + 25 * s, y - 60 * s, 30 * s, 0, Math.PI * 2);
        ctx.fill();
    },

    drawFlower(x, y, color) {
        const ctx = this.ctx;
        // Stem
        ctx.fillStyle = '#228B22';
        ctx.fillRect(x - 1, y - 20, 3, 20);
        // Petals
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const angle = (i / 5) * Math.PI * 2;
            ctx.arc(x + Math.cos(angle) * 6, y - 25 + Math.sin(angle) * 6, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Center
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y - 25, 4, 0, Math.PI * 2);
        ctx.fill();
    },

    drawBush(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x - size * 0.6, y + 5, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y + 5, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    },

    drawCactus(x, y, scale) {
        const ctx = this.ctx;
        const s = scale;
        ctx.fillStyle = '#228B22';
        // Main body
        ctx.beginPath();
        ctx.roundRect(x - 12 * s, y - 80 * s, 24 * s, 80 * s, 12 * s);
        ctx.fill();
        // Left arm
        ctx.beginPath();
        ctx.roundRect(x - 35 * s, y - 60 * s, 25 * s, 15 * s, 7 * s);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x - 35 * s, y - 80 * s, 15 * s, 35 * s, 7 * s);
        ctx.fill();
        // Right arm
        ctx.beginPath();
        ctx.roundRect(x + 10 * s, y - 45 * s, 25 * s, 15 * s, 7 * s);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + 20 * s, y - 70 * s, 15 * s, 40 * s, 7 * s);
        ctx.fill();
    },

    drawRock(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.quadraticCurveTo(x - size * 0.8, y - size * 0.8, x, y - size * 0.6);
        ctx.quadraticCurveTo(x + size * 0.8, y - size * 0.7, x + size, y);
        ctx.fill();
    },

    drawPineTree(x, y, scale) {
        const ctx = this.ctx;
        const s = scale;
        // Trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 6 * s, y - 20 * s, 12 * s, 20 * s);
        // Tree layers
        ctx.fillStyle = '#0B5345';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y - 120 * s + i * 30 * s);
            ctx.lineTo(x - 30 * s - i * 10 * s, y - 40 * s + i * 30 * s);
            ctx.lineTo(x + 30 * s + i * 10 * s, y - 40 * s + i * 30 * s);
            ctx.fill();
        }
        // Snow on tree
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x, y - 120 * s);
        ctx.lineTo(x - 15 * s, y - 100 * s);
        ctx.lineTo(x + 15 * s, y - 100 * s);
        ctx.fill();
    },

    drawSnowman(x, y) {
        const ctx = this.ctx;
        // Body
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y - 25, 25, 0, Math.PI * 2);
        ctx.arc(x, y - 60, 18, 0, Math.PI * 2);
        ctx.arc(x, y - 88, 12, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - 4, y - 92, 2, 0, Math.PI * 2);
        ctx.arc(x + 4, y - 92, 2, 0, Math.PI * 2);
        ctx.fill();
        // Nose (carrot)
        ctx.fillStyle = '#FF6B00';
        ctx.beginPath();
        ctx.moveTo(x, y - 88);
        ctx.lineTo(x + 12, y - 86);
        ctx.lineTo(x, y - 84);
        ctx.fill();
        // Hat
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 15, y - 105, 30, 5);
        ctx.fillRect(x - 10, y - 125, 20, 20);
        // Buttons
        ctx.beginPath();
        ctx.arc(x, y - 55, 3, 0, Math.PI * 2);
        ctx.arc(x, y - 65, 3, 0, Math.PI * 2);
        ctx.fill();
    },

    drawCrater(x, y, size) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2A2A4A';
        ctx.beginPath();
        ctx.ellipse(x, y + 3, size * 0.7, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawFlag(x, y) {
        const ctx = this.ctx;
        // Pole
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(x, y - 80, 3, 80);
        // Flag
        ctx.fillStyle = '#B22234';
        ctx.fillRect(x + 3, y - 80, 40, 25);
        // Stripes
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 6; i += 2) {
            ctx.fillRect(x + 3, y - 80 + i * 4 + 4, 40, 4);
        }
        // Blue corner
        ctx.fillStyle = '#3C3B6E';
        ctx.fillRect(x + 3, y - 80, 16, 13);
    },

    // City decorations - buildings, street lights, signs
    drawCityDecorations() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const groundY = h - 50;

        // Stars in night sky
        this.drawStars();

        // Moon
        ctx.fillStyle = '#F5F5DC';
        ctx.beginPath();
        ctx.arc(w * 0.85, h * 0.12, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#E8E8D0';
        ctx.beginPath();
        ctx.arc(w * 0.83, h * 0.1, 8, 0, Math.PI * 2);
        ctx.arc(w * 0.88, h * 0.14, 5, 0, Math.PI * 2);
        ctx.fill();

        // Background buildings (silhouettes)
        ctx.fillStyle = '#1a1a2e';
        // Building 1
        ctx.fillRect(w * 0.05, groundY - 180, 60, 180);
        // Building 2
        ctx.fillRect(w * 0.12, groundY - 220, 80, 220);
        // Building 3
        ctx.fillRect(w * 0.25, groundY - 150, 50, 150);

        // Windows (lit)
        ctx.fillStyle = '#FFE066';
        for (let bx = w * 0.05; bx < w * 0.35; bx += 30) {
            for (let by = groundY - 160; by < groundY - 20; by += 25) {
                if (Math.random() > 0.3) {
                    ctx.fillRect(bx + 8, by, 10, 15);
                }
            }
        }

        // Street lamp
        ctx.fillStyle = '#333';
        ctx.fillRect(w * 0.2, groundY - 100, 5, 100);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(w * 0.2 + 2, groundY - 105, 12, 0, Math.PI * 2);
        ctx.fill();
        // Lamp glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(w * 0.2 + 2, groundY - 105, 40, 0, Math.PI * 2);
        ctx.fill();

        // Fire hydrant
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(w * 0.15 - 8, groundY - 30, 16, 30);
        ctx.fillRect(w * 0.15 - 12, groundY - 25, 24, 8);

        // Trash can
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(w * 0.28, groundY - 40, 25, 40);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(w * 0.28 - 2, groundY - 45, 29, 8);
    },

    // Jungle decorations - vines, trees, animals, temple ruins
    drawJungleDecorations() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const groundY = h - 50;

        // Mist/fog layer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(0, groundY - 100, w, 100);

        // Background large trees
        this.drawJungleTree(w * 0.02, groundY, 1.2);
        this.drawJungleTree(w * 0.12, groundY, 0.9);

        // Temple ruins in background
        ctx.fillStyle = '#8B8B7A';
        ctx.fillRect(w * 0.6, groundY - 100, 80, 100);
        ctx.fillRect(w * 0.55, groundY - 120, 90, 25);
        // Temple details
        ctx.fillStyle = '#6B6B5A';
        ctx.fillRect(w * 0.65, groundY - 90, 20, 60);
        ctx.fillRect(w * 0.72, groundY - 80, 15, 50);

        // Hanging vines from top
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            const vx = (i * w / 8) + 30;
            const vh = 50 + Math.sin(i * 2) * 30;
            ctx.beginPath();
            ctx.moveTo(vx, 0);
            ctx.quadraticCurveTo(vx + 20, vh / 2, vx - 10, vh);
            ctx.stroke();
            // Leaves on vines
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.ellipse(vx - 10, vh, 8, 4, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ferns and bushes on ground
        ctx.fillStyle = '#228B22';
        this.drawFern(w * 0.25, groundY);
        this.drawFern(w * 0.45, groundY);

        // Exotic flowers
        ctx.fillStyle = '#FF69B4';
        this.drawExoticFlower(w * 0.3, groundY - 20);
        ctx.fillStyle = '#FF4500';
        this.drawExoticFlower(w * 0.5, groundY - 15);

        // Monkey in tree
        ctx.font = '35px Arial';
        ctx.fillText('🐒', w * 0.08, groundY - 120);

        // Butterfly
        ctx.font = '25px Arial';
        ctx.fillText('🦋', w * 0.4, groundY - 80);
    },

    drawJungleTree(x, y, scale) {
        const ctx = this.ctx;
        const s = scale;
        // Thick trunk
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(x - 15 * s, y - 150 * s, 30 * s, 150 * s);
        // Roots
        ctx.beginPath();
        ctx.moveTo(x - 30 * s, y);
        ctx.quadraticCurveTo(x - 20 * s, y - 20 * s, x - 15 * s, y - 30 * s);
        ctx.lineTo(x - 15 * s, y);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 30 * s, y);
        ctx.quadraticCurveTo(x + 20 * s, y - 20 * s, x + 15 * s, y - 30 * s);
        ctx.lineTo(x + 15 * s, y);
        ctx.fill();
        // Canopy
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.arc(x, y - 160 * s, 60 * s, 0, Math.PI * 2);
        ctx.arc(x - 40 * s, y - 130 * s, 45 * s, 0, Math.PI * 2);
        ctx.arc(x + 40 * s, y - 130 * s, 45 * s, 0, Math.PI * 2);
        ctx.fill();
    },

    drawFern(x, y) {
        const ctx = this.ctx;
        ctx.fillStyle = '#228B22';
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + i * 15, y - 40, x + i * 25, y - 30);
            ctx.quadraticCurveTo(x + i * 15, y - 35, x, y);
            ctx.fill();
        }
    },

    drawExoticFlower(x, y) {
        const ctx = this.ctx;
        // Petals
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            const angle = (i / 6) * Math.PI * 2;
            ctx.ellipse(x + Math.cos(angle) * 12, y + Math.sin(angle) * 12, 10, 5, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        // Center
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
    },

    // Store current level for decoration rendering
    currentLevelNum: 1,

    // Render decorations for the current level
    renderDecorations(layer = 'back') {
        if (!this.currentLevelNum) return;
        const levelConfig = Levels.get(this.currentLevelNum);
        if (!levelConfig.decorations) return;

        const ctx = this.ctx;
        levelConfig.decorations.forEach(dec => {
            const decLayer = dec.layer || 'back';
            if (decLayer !== layer) return;

            const x = dec.x * this.width;
            const y = dec.y * this.height;
            const size = dec.size || 40;

            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dec.emoji, x, y);
        });
    },

    drawStars() {
        this.ctx.fillStyle = '#FFFFFF';
        // Use seeded random for consistent stars
        const seed = 12345;
        for (let i = 0; i < 100; i++) {
            const x = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280 * this.width;
            const y = ((seed * (i + 1) * 49297 + 9301) % 233280) / 233280 * (this.height * 0.6);
            const size = ((seed * (i + 1) * 1234) % 3) + 1;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    drawGround(type) {
        const groundY = this.height - 50;

        switch (type) {
            case 'desert':
                this.ctx.fillStyle = '#D4A55A';
                break;
            case 'snow':
                this.ctx.fillStyle = '#FFFFFF';
                break;
            case 'moon':
                this.ctx.fillStyle = '#4A4A6A';
                break;
            default:
                this.ctx.fillStyle = '#7BC043';
        }

        this.ctx.fillRect(0, groundY, this.width, 50);

        // Ground detail
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(0, groundY, this.width, 5);
    },

    drawBody(body, data) {
        const vertices = body.vertices;
        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = data.color || '#8B4513';
        this.ctx.fill();
        this.ctx.strokeStyle = '#5D3A1A';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    },

    drawTarget(target) {
        const pos = target.body.position;
        const angle = target.body.angle;
        const data = target.data;

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(angle);

        // Calculate damage level based on hit count (0, 1, 2 hits = 0%, 33%, 66% damage)
        const damagePercent = (target.hitCount || 0) / 3;

        // Draw based on target type
        if (data.emoji) {
            const fontSize = (data.size || 80) * 2; // Much bigger emojis
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Draw solid background circle to make emoji more visible
            const bgRadius = fontSize * 0.55;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, bgRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw background border
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            // Draw shadow for depth
            this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
            this.ctx.fillText(data.emoji, 4, 4);

            // Draw main emoji
            this.ctx.fillText(data.emoji, 0, 0);

            // Draw damage effects on top
            if (damagePercent > 0) {
                this.drawDamageEffects(damagePercent, fontSize);
            }
        } else {
            // Default box shape - make bigger
            const w = (data.width || 80) * 1.5;
            const h = (data.height || 80) * 1.5;

            // Base color gets darker/more damaged looking
            let baseColor = data.color || '#FF6B6B';
            if (damagePercent > 0) {
                baseColor = this.darkenColor(baseColor, damagePercent * 0.4);
            }

            // Draw shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.fillRect(-w / 2 + 5, -h / 2 + 5, w, h);

            // Draw main box
            this.ctx.fillStyle = baseColor;
            this.ctx.fillRect(-w / 2, -h / 2, w, h);

            // Border
            this.ctx.strokeStyle = this.darkenColor(baseColor, 0.3);
            this.ctx.lineWidth = 5;
            this.ctx.strokeRect(-w / 2, -h / 2, w, h);

            // Draw cracks and damage on boxes
            if (damagePercent > 0) {
                this.drawBoxDamage(w, h, damagePercent);
            }
        }

        this.ctx.restore();
    },

    // Draw damage effects (bruises, cracks, etc.)
    drawDamageEffects(damagePercent, size) {
        const radius = size * 0.4;

        // Draw bruise/damage marks based on damage level
        if (damagePercent > 0.1) {
            // Light damage - small marks
            this.ctx.fillStyle = 'rgba(100, 60, 60, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(radius * 0.3, -radius * 0.2, size * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (damagePercent > 0.3) {
            // Medium damage - more marks and some cracks
            this.ctx.fillStyle = 'rgba(80, 40, 40, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(-radius * 0.4, radius * 0.1, size * 0.1, 0, Math.PI * 2);
            this.ctx.fill();

            // Crack lines
            this.ctx.strokeStyle = 'rgba(60, 30, 30, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(-radius * 0.2, -radius * 0.3);
            this.ctx.lineTo(radius * 0.1, radius * 0.2);
            this.ctx.stroke();
        }

        if (damagePercent > 0.5) {
            // Heavy damage - big bruises and multiple cracks
            this.ctx.fillStyle = 'rgba(60, 20, 20, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(radius * 0.2, radius * 0.3, size * 0.12, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(80, 30, 30, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(-radius * 0.3, -radius * 0.4, size * 0.09, 0, Math.PI * 2);
            this.ctx.fill();

            // More cracks
            this.ctx.strokeStyle = 'rgba(40, 20, 20, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(radius * 0.3, -radius * 0.2);
            this.ctx.lineTo(radius * 0.1, radius * 0.4);
            this.ctx.lineTo(-radius * 0.2, radius * 0.3);
            this.ctx.stroke();
        }

        if (damagePercent > 0.75) {
            // Critical damage - about to break!
            this.ctx.fillStyle = 'rgba(40, 10, 10, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
            this.ctx.fill();

            // Lots of cracks
            this.ctx.strokeStyle = 'rgba(30, 10, 10, 0.7)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(-radius * 0.4, -radius * 0.4);
            this.ctx.lineTo(radius * 0.2, 0);
            this.ctx.lineTo(radius * 0.4, radius * 0.4);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(radius * 0.3, -radius * 0.3);
            this.ctx.lineTo(-radius * 0.1, radius * 0.1);
            this.ctx.stroke();
        }
    },

    // Draw damage on box targets
    drawBoxDamage(w, h, damagePercent) {
        const hw = w / 2;
        const hh = h / 2;

        // Dents and dark spots
        this.ctx.fillStyle = `rgba(0, 0, 0, ${damagePercent * 0.3})`;

        if (damagePercent > 0.2) {
            this.ctx.beginPath();
            this.ctx.arc(-hw * 0.3, -hh * 0.2, w * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (damagePercent > 0.4) {
            this.ctx.beginPath();
            this.ctx.arc(hw * 0.2, hh * 0.3, w * 0.12, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Cracks
        this.ctx.strokeStyle = `rgba(0, 0, 0, ${damagePercent * 0.5})`;
        this.ctx.lineWidth = 2;

        if (damagePercent > 0.3) {
            this.ctx.beginPath();
            this.ctx.moveTo(-hw * 0.5, -hh * 0.3);
            this.ctx.lineTo(hw * 0.2, hh * 0.1);
            this.ctx.stroke();
        }

        if (damagePercent > 0.6) {
            this.ctx.beginPath();
            this.ctx.moveTo(hw * 0.3, -hh * 0.5);
            this.ctx.lineTo(-hw * 0.1, hh * 0.4);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(-hw * 0.4, hh * 0.2);
            this.ctx.lineTo(hw * 0.4, hh * 0.4);
            this.ctx.stroke();
        }
    },

    // Helper to darken a color
    darkenColor(color, amount) {
        // Handle hex colors
        if (color.startsWith('#')) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);

            r = Math.floor(r * (1 - amount));
            g = Math.floor(g * (1 - amount));
            b = Math.floor(b * (1 - amount));

            return `rgb(${r}, ${g}, ${b})`;
        }
        return color;
    },

    drawProjectile(projectile) {
        const pos = projectile.body.position;
        const angle = projectile.body.angle;
        const data = projectile.data;

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(angle);

        if (data.emoji) {
            this.ctx.font = `${(data.size || 15) * 2}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(data.emoji, 0, 0);
        } else {
            // Default projectile look
            this.ctx.beginPath();
            this.ctx.arc(0, 0, data.size || 15, 0, Math.PI * 2);
            this.ctx.fillStyle = data.color || '#E74C3C';
            this.ctx.fill();
            this.ctx.strokeStyle = '#C0392B';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.restore();

        // Draw trail
        if (data.trail) {
            this.drawTrail(projectile);
        }
    },

    drawTrail(projectile) {
        const pos = projectile.body.position;
        const vel = projectile.body.velocity;

        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(pos.x - vel.x * 3, pos.y - vel.y * 3);
        this.ctx.strokeStyle = projectile.data.trailColor || 'rgba(255,100,100,0.5)';
        this.ctx.lineWidth = projectile.data.size || 10;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }
};
