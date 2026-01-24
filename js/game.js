// Main Game Controller
const Game = {
    state: {
        currentLevel: 1,
        score: 0,
        lives: 3,
        missilesLeft: 6,
        totalMissiles: 6,
        isPaused: false,
        isPlaying: false,
        selectedVehicle: 'jeep',
        selectedProjectile: 'pizza',
        selectedBackground: 'backyard',
        ammoInventory: [],
        selectedAmmoIndex: 0
    },

    effects: [],
    lastTime: 0,
    animationId: null,

    init() {
        // Initialize all systems
        Scores.init();
        GameProgress.init();
        ArmyGuy.init();
        UI.init();

        // Initialize physics
        Physics.init('game-canvas');

        // Initialize launcher
        Launcher.init(Physics.width, Physics.height);

        // Set up input handlers
        this.setupInputHandlers();

        // Show title screen
        UI.showScreen('title');

        console.log('Missile Mayhem initialized!');
    },

    setupInputHandlers() {
        const canvas = Physics.canvas;

        // Unified pointer events for mouse and touch
        const getPointerPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        // Pointer down
        const onPointerDown = (e) => {
            if (!this.state.isPlaying || this.state.isPaused) return;
            if (this.state.missilesLeft <= 0) return;

            e.preventDefault();
            const pos = getPointerPos(e);
            Launcher.handlePointerDown(pos.x, pos.y);
        };

        // Pointer move
        const onPointerMove = (e) => {
            if (!this.state.isPlaying || this.state.isPaused) return;

            e.preventDefault();
            const pos = getPointerPos(e);
            Launcher.handlePointerMove(pos.x, pos.y);
        };

        // Pointer up
        const onPointerUp = (e) => {
            if (!this.state.isPlaying || this.state.isPaused) return;

            e.preventDefault();

            const launchData = Launcher.handlePointerUp();
            if (launchData) {
                this.fireProjectile(launchData);
            }
        };

        // Mouse events
        canvas.addEventListener('mousedown', onPointerDown);
        canvas.addEventListener('mousemove', onPointerMove);
        canvas.addEventListener('mouseup', onPointerUp);
        canvas.addEventListener('mouseleave', onPointerUp);

        // Touch events
        canvas.addEventListener('touchstart', onPointerDown, { passive: false });
        canvas.addEventListener('touchmove', onPointerMove, { passive: false });
        canvas.addEventListener('touchend', onPointerUp, { passive: false });
        canvas.addEventListener('touchcancel', onPointerUp, { passive: false });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.state.isPlaying) {
                Physics.resize();
                Launcher.resize(Physics.width, Physics.height);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isPlaying) {
                this.togglePause();
            }
            // Number keys to select ammo
            if (e.key >= '1' && e.key <= '6' && this.state.isPlaying) {
                const index = parseInt(e.key) - 1;
                this.selectAmmo(index);
            }
        });
    },

    async startLevel(levelNum, options) {
        this.state.currentLevel = levelNum;
        this.state.selectedVehicle = options.vehicle;
        this.state.selectedProjectile = options.projectile;
        this.state.selectedBackground = options.background;

        // Set up launcher
        Launcher.setVehicle(options.vehicle);
        Launcher.setProjectile(options.projectile);

        // Set up physics gravity based on background and store level number for decorations
        const bg = Backgrounds.get(options.background);
        Physics.setGravity(bg.gravity.x, bg.gravity.y);
        Physics.currentLevelNum = levelNum;

        // Reset level state
        this.state.missilesLeft = this.state.totalMissiles;
        this.state.ammoInventory = this.createAmmoInventory(options.projectile);
        this.state.selectedAmmoIndex = 0;

        // Show game screen
        UI.showScreen('game');
        this.state.isPlaying = true;
        this.state.isPaused = false;

        // Clear previous level
        Physics.clear();
        this.effects = [];

        // Resize canvas
        Physics.resize();
        Launcher.resize(Physics.width, Physics.height);

        // Load level targets
        const targets = Levels.createTargets(levelNum, Physics.width, Physics.height);
        targets.forEach(t => {
            Physics.addTarget(t.x, t.y, t.width, t.height, t);
        });

        // Load platforms
        const platforms = Levels.createPlatforms(levelNum, Physics.width, Physics.height);
        platforms.forEach(p => {
            Physics.addStaticBody(p.x, p.y, p.width, p.height, { color: p.color });
        });

        // Update HUD
        UI.updateHUD(this.state);
        UI.populateAmmoBar(this.state.ammoInventory, this.state.selectedAmmoIndex);

        // Start game loop immediately
        this.startGameLoop();
    },

    createAmmoInventory(projectileId) {
        const projectile = Projectiles.get(projectileId);
        const inventory = [];

        for (let i = 0; i < this.state.totalMissiles; i++) {
            inventory.push({ ...projectile });
        }

        return inventory;
    },

    fireProjectile(launchData) {
        if (this.state.missilesLeft <= 0) return;
        if (this.state.ammoInventory[this.state.selectedAmmoIndex] === null) return;

        // Get current ammo
        const ammo = this.state.ammoInventory[this.state.selectedAmmoIndex];

        // Fire projectile
        Physics.addProjectile(
            launchData.x,
            launchData.y,
            launchData.velocityX,
            launchData.velocityY,
            ammo
        );

        // Remove from inventory
        this.state.ammoInventory[this.state.selectedAmmoIndex] = null;
        this.state.missilesLeft--;

        // Find next available ammo
        this.selectNextAvailableAmmo();

        // Update UI
        UI.updateHUD(this.state);
        UI.populateAmmoBar(this.state.ammoInventory, this.state.selectedAmmoIndex);
    },

    selectAmmo(index) {
        if (index >= 0 && index < this.state.ammoInventory.length) {
            if (this.state.ammoInventory[index] !== null) {
                this.state.selectedAmmoIndex = index;
                Launcher.setProjectile(this.state.ammoInventory[index].id);
                UI.updateAmmoBar(this.state.selectedAmmoIndex);
            }
        }
    },

    selectNextAvailableAmmo() {
        // Try to find next available ammo starting from current position
        for (let i = 0; i < this.state.ammoInventory.length; i++) {
            const index = (this.state.selectedAmmoIndex + i) % this.state.ammoInventory.length;
            if (this.state.ammoInventory[index] !== null) {
                this.state.selectedAmmoIndex = index;
                Launcher.setProjectile(this.state.ammoInventory[index].id);
                return;
            }
        }
    },

    onTargetDestroyed(target) {
        // Add score
        this.state.score += target.points;
        UI.updateHUD(this.state);

        // Create score popup effect
        UI.createScorePopup(target.body.position.x, target.body.position.y, target.points);

        // Check for level completion
        this.checkLevelComplete();
    },

    createImpactEffect(position) {
        this.effects.push({
            type: 'explosion',
            x: position.x,
            y: position.y,
            radius: 5,
            maxRadius: 50,
            alpha: 1,
            createdAt: Date.now()
        });
    },

    checkLevelComplete() {
        // Check if all targets destroyed
        if (Physics.targets.length === 0) {
            this.levelWon();
            return;
        }

        // Check if out of missiles and projectiles settled
        if (this.state.missilesLeft === 0 && Physics.projectiles.length === 0) {
            // Wait a moment for physics to settle
            setTimeout(() => {
                if (Physics.targets.length > 0) {
                    this.levelLost();
                } else {
                    this.levelWon();
                }
            }, 1500);
        }
    },

    levelWon() {
        this.state.isPaused = true;

        // Calculate bonus for remaining missiles
        const missileBonus = this.state.missilesLeft * 100;
        this.state.score += missileBonus;
        UI.updateHUD(this.state);

        // Unlock new content
        const unlocks = GameProgress.unlockForLevel(this.state.currentLevel);

        // Check if game complete
        if (this.state.currentLevel >= Levels.count()) {
            this.gameVictory();
        } else {
            // Immediately start next level with its designated background
            this.state.currentLevel++;
            const nextLevel = Levels.get(this.state.currentLevel);
            this.startLevel(this.state.currentLevel, {
                vehicle: this.state.selectedVehicle,
                projectile: this.state.selectedProjectile,
                background: nextLevel.background
            });
        }
    },

    levelLost() {
        this.state.isPaused = true;
        this.state.lives--;

        if (this.state.lives <= 0) {
            // Game over - go directly to game over screen
            this.gameOver();
        } else {
            // Restart level immediately with its designated background
            const levelConfig = Levels.get(this.state.currentLevel);
            this.startLevel(this.state.currentLevel, {
                vehicle: this.state.selectedVehicle,
                projectile: this.state.selectedProjectile,
                background: levelConfig.background
            });
        }
    },

    gameOver() {
        this.stopGameLoop();
        this.state.isPlaying = false;

        // Save progress
        GameProgress.addToTotalScore(this.state.score);

        // Check for high score
        const isHighScore = Scores.isHighScore(this.state.score);

        // Show game over screen
        UI.showGameOver(this.state.score, isHighScore);

        // Reset state for next game
        this.resetGameState();
    },

    async gameVictory() {
        this.stopGameLoop();
        this.state.isPlaying = false;

        // Show victory message from Army Guy
        await ArmyGuy.show('victory');

        // Save progress
        GameProgress.addToTotalScore(this.state.score);

        // Check for high score
        const isHighScore = Scores.isHighScore(this.state.score);

        // Show victory screen
        UI.showVictory(this.state.score, isHighScore);

        // Reset state for next game
        this.resetGameState();
    },

    resetGameState() {
        this.state.currentLevel = 1;
        this.state.score = 0;
        this.state.lives = 3;
        this.state.missilesLeft = 6;
    },

    togglePause() {
        this.state.isPaused = !this.state.isPaused;

        if (this.state.isPaused) {
            UI.showPauseMenu();
        } else {
            UI.hidePauseMenu();
        }
    },

    restartLevel() {
        this.state.isPaused = false;
        UI.hidePauseMenu();

        this.startLevel(this.state.currentLevel, {
            vehicle: this.state.selectedVehicle,
            projectile: this.state.selectedProjectile,
            background: this.state.selectedBackground
        });
    },

    quitToMenu() {
        this.stopGameLoop();
        this.state.isPlaying = false;
        this.state.isPaused = false;
        Physics.clear();

        this.resetGameState();
        UI.showScreen('title');
    },

    // Game Loop
    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop();
    },

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    gameLoop(currentTime = performance.now()) {
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));

        const delta = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.state.isPaused) {
            // Update physics
            Physics.update(delta);

            // Check level completion
            if (Physics.projectiles.length === 0 && this.state.missilesLeft === 0) {
                // All projectiles gone
                setTimeout(() => {
                    if (this.state.isPlaying && !this.state.isPaused) {
                        if (Physics.targets.length > 0) {
                            this.levelLost();
                        }
                    }
                }, 500);
            }
        }

        // Render
        this.render();
    },

    render() {
        // Render physics world
        Physics.render(this.state.selectedBackground);

        // Render launcher
        Launcher.render(Physics.ctx);

        // Render effects
        this.renderEffects(Physics.ctx);
    },

    renderEffects(ctx) {
        const now = Date.now();

        this.effects = this.effects.filter(effect => {
            const age = now - effect.createdAt;

            if (effect.type === 'explosion') {
                const duration = 500;
                if (age > duration) return false;

                const progress = age / duration;
                effect.radius = effect.maxRadius * progress;
                effect.alpha = 1 - progress;

                ctx.beginPath();
                ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);

                const gradient = ctx.createRadialGradient(
                    effect.x, effect.y, 0,
                    effect.x, effect.y, effect.radius
                );
                gradient.addColorStop(0, `rgba(255, 200, 50, ${effect.alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 50, ${effect.alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(255, 50, 50, 0)`);

                ctx.fillStyle = gradient;
                ctx.fill();

                return true;
            }

            if (effect.type === 'scorePopup') {
                const duration = 1000;
                if (age > duration) return false;

                const progress = age / duration;
                effect.offsetY = -50 * progress;
                effect.alpha = 1 - progress;

                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = `rgba(255, 215, 0, ${effect.alpha})`;
                ctx.strokeStyle = `rgba(0, 0, 0, ${effect.alpha})`;
                ctx.lineWidth = 3;
                ctx.strokeText(effect.text, effect.x, effect.y + effect.offsetY);
                ctx.fillText(effect.text, effect.x, effect.y + effect.offsetY);

                return true;
            }

            return false;
        });
    }
};

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
