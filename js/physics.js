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
        // Calculate projectile speed
        const velocity = projectile.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

        // Direct hit = fast projectile (speed > 8) destroys in 1 hit
        // Glancing hit = slower projectile takes 3 hits to destroy
        const isDirectHit = speed > 8;

        // Initialize hit count if not set
        if (target.hitCount === undefined) {
            target.hitCount = 0;
        }

        // Create impact effect
        if (Game && Game.createImpactEffect) {
            Game.createImpactEffect(pair.collision.supports[0] || target.body.position);
        }

        if (isDirectHit) {
            // Direct hit - destroy immediately!
            target.hitCount = 3;
            target.health = 0;
            this.destroyTarget(target);
        } else {
            // Glancing hit - increment hit counter
            target.hitCount++;
            // Update health for visual damage (33% per hit)
            target.health = target.data.health * (1 - target.hitCount / 3);

            // Destroy after 3 hits
            if (target.hitCount >= 3) {
                this.destroyTarget(target);
            }
        }

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

        // Draw ground
        this.drawGround(backgroundType);

        // Draw static bodies (platforms, etc.)
        this.bodies.forEach(b => this.drawBody(b.body, b.data));

        // Draw targets
        this.targets.forEach(t => this.drawTarget(t));

        // Draw projectiles
        this.projectiles.forEach(p => this.drawProjectile(p));
    },

    drawBackground(type) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);

        switch (type) {
            case 'desert':
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.6, '#F4D03F');
                gradient.addColorStop(1, '#E67E22');
                break;
            case 'snow':
                gradient.addColorStop(0, '#A8D8EA');
                gradient.addColorStop(0.5, '#FFFFFF');
                gradient.addColorStop(1, '#D5DBDB');
                break;
            case 'moon':
                gradient.addColorStop(0, '#0C0C1E');
                gradient.addColorStop(0.5, '#1A1A3E');
                gradient.addColorStop(1, '#2C2C4E');
                // Draw stars
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.drawStars();
                return;
            default: // backyard
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#98D8C8');
                gradient.addColorStop(1, '#7BC043');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
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
