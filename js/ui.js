// UI Manager
const UI = {
    screens: {},
    currentScreen: null,
    selectedLevel: 1,
    selectedVehicle: 'jeep',
    selectedProjectile: 'standardMissile',
    selectedBackground: 'backyard',
    selectedAmmoSlot: 0,

    init() {
        // Cache screen elements
        this.screens = {
            title: document.getElementById('title-screen'),
            levelSelect: document.getElementById('level-select-screen'),
            loadout: document.getElementById('loadout-screen'),
            game: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over-screen'),
            victory: document.getElementById('victory-screen'),
            highScores: document.getElementById('high-scores-screen')
        };

        this.setupEventListeners();
    },

    setupEventListeners() {
        // Title screen buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            this.showScreen('levelSelect');
        });

        document.getElementById('scores-btn').addEventListener('click', () => {
            this.showHighScores();
        });

        // Level select
        document.getElementById('back-to-title').addEventListener('click', () => {
            this.showScreen('title');
        });

        // Loadout screen
        document.getElementById('back-to-levels').addEventListener('click', () => {
            this.showScreen('levelSelect');
        });

        document.getElementById('start-mission').addEventListener('click', () => {
            Game.startLevel(this.selectedLevel, {
                vehicle: this.selectedVehicle,
                projectile: this.selectedProjectile,
                background: this.selectedBackground
            });
        });

        // Game screen
        document.getElementById('pause-btn').addEventListener('click', () => {
            Game.togglePause();
        });

        // Pause menu
        document.getElementById('resume-btn').addEventListener('click', () => {
            Game.togglePause();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            Game.restartLevel();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            Game.quitToMenu();
        });

        // Game over screen
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.showScreen('levelSelect');
        });

        document.getElementById('main-menu-btn').addEventListener('click', () => {
            this.showScreen('title');
        });

        document.getElementById('save-score-btn').addEventListener('click', () => {
            this.saveScore();
        });

        // Victory screen
        document.getElementById('victory-menu-btn').addEventListener('click', () => {
            this.showScreen('title');
        });

        document.getElementById('victory-save-score-btn').addEventListener('click', () => {
            this.saveVictoryScore();
        });

        // High scores back button
        document.getElementById('scores-back-btn').addEventListener('click', () => {
            this.showScreen('title');
        });
    },

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });

        // Hide dialogs
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('army-guy-dialog').classList.add('hidden');

        // Show requested screen
        const screen = this.screens[screenName];
        if (screen) {
            screen.classList.remove('hidden');
            this.currentScreen = screenName;

            // Initialize screen content
            if (screenName === 'levelSelect') {
                this.populateLevelButtons();
            } else if (screenName === 'loadout') {
                this.populateLoadout();
            }
        }
    },

    populateLevelButtons() {
        const container = document.getElementById('level-buttons');
        container.innerHTML = '';

        for (let i = 1; i <= Levels.count(); i++) {
            const level = Levels.get(i);
            const btn = document.createElement('button');
            btn.className = 'level-btn';

            const isUnlocked = GameProgress.isLevelUnlocked(i);
            const isCompleted = GameProgress.isLevelCompleted(i);

            if (isCompleted) {
                btn.classList.add('completed');
            }

            btn.disabled = !isUnlocked;
            btn.innerHTML = isUnlocked ? i : '🔒';
            btn.title = isUnlocked ? level.name : 'Locked';

            if (isUnlocked) {
                btn.addEventListener('click', () => {
                    this.selectedLevel = i;
                    this.showScreen('loadout');
                });
            }

            container.appendChild(btn);
        }
    },

    populateLoadout() {
        this.populateVehicleOptions();
        this.populateAmmoOptions();
        this.populateBackgroundOptions();
    },

    populateVehicleOptions() {
        const container = document.getElementById('vehicle-options');
        container.innerHTML = '';

        Object.values(Vehicles.types).forEach(vehicle => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            const isUnlocked = GameProgress.isVehicleUnlocked(vehicle.id);

            btn.disabled = !isUnlocked;
            btn.innerHTML = `${vehicle.emoji} ${vehicle.name}${!isUnlocked ? ' <span class="lock-icon">🔒</span>' : ''}`;
            btn.title = vehicle.description;

            if (vehicle.id === this.selectedVehicle) {
                btn.classList.add('selected');
            }

            if (isUnlocked) {
                btn.addEventListener('click', () => {
                    this.selectedVehicle = vehicle.id;
                    this.populateVehicleOptions();
                });
            }

            container.appendChild(btn);
        });
    },

    populateAmmoOptions() {
        const container = document.getElementById('ammo-options');
        container.innerHTML = '';

        Object.values(Projectiles.types).forEach(proj => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            const isUnlocked = GameProgress.isProjectileUnlocked(proj.id);

            btn.disabled = !isUnlocked;
            btn.innerHTML = `${proj.emoji} ${proj.name}${!isUnlocked ? ' <span class="lock-icon">🔒</span>' : ''}`;
            btn.title = proj.description;

            if (proj.id === this.selectedProjectile) {
                btn.classList.add('selected');
            }

            if (isUnlocked) {
                btn.addEventListener('click', () => {
                    this.selectedProjectile = proj.id;
                    this.populateAmmoOptions();
                });
            }

            container.appendChild(btn);
        });
    },

    populateBackgroundOptions() {
        const container = document.getElementById('background-options');
        container.innerHTML = '';

        Object.values(Backgrounds.types).forEach(bg => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            const isUnlocked = GameProgress.isBackgroundUnlocked(bg.id);

            btn.disabled = !isUnlocked;
            btn.innerHTML = `${bg.emoji} ${bg.name}${!isUnlocked ? ' <span class="lock-icon">🔒</span>' : ''}`;
            btn.title = bg.description;

            if (bg.id === this.selectedBackground) {
                btn.classList.add('selected');
            }

            if (isUnlocked) {
                btn.addEventListener('click', () => {
                    this.selectedBackground = bg.id;
                    this.populateBackgroundOptions();
                });
            }

            container.appendChild(btn);
        });
    },

    // HUD Updates
    updateHUD(gameState) {
        document.getElementById('score-display').textContent = `SCORE: ${gameState.score}`;
        document.getElementById('level-display').textContent = `LEVEL ${gameState.currentLevel}`;
        document.getElementById('missiles-display').textContent = `MISSILES: ${gameState.missilesLeft}`;

        // Update lives display
        const livesContainer = document.getElementById('lives-display');
        livesContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const life = document.createElement('span');
            life.className = 'life-icon';
            life.textContent = i < gameState.lives ? '❤️' : '🖤';
            livesContainer.appendChild(life);
        }
    },

    populateAmmoBar(projectiles, selectedIndex) {
        const container = document.getElementById('ammo-bar');
        container.innerHTML = '';

        projectiles.forEach((proj, index) => {
            const slot = document.createElement('div');
            slot.className = 'ammo-slot';

            if (proj) {
                slot.textContent = proj.emoji || '🎯';
                slot.title = proj.name;

                if (index === selectedIndex) {
                    slot.classList.add('active');
                }

                slot.addEventListener('click', () => {
                    Game.selectAmmo(index);
                });
            } else {
                slot.classList.add('empty');
                slot.textContent = '•';
            }

            container.appendChild(slot);
        });
    },

    updateAmmoBar(selectedIndex) {
        const slots = document.querySelectorAll('.ammo-slot');
        slots.forEach((slot, index) => {
            slot.classList.toggle('active', index === selectedIndex);
        });
    },

    // Pause menu
    showPauseMenu() {
        document.getElementById('pause-menu').classList.remove('hidden');
    },

    hidePauseMenu() {
        document.getElementById('pause-menu').classList.add('hidden');
    },

    // Game over
    showGameOver(score, isHighScore) {
        this.showScreen('gameOver');
        document.getElementById('final-score').textContent = `FINAL SCORE: ${score}`;

        const nameEntry = document.getElementById('name-entry');
        if (isHighScore) {
            nameEntry.classList.remove('hidden');
            document.getElementById('player-name').value = '';
            document.getElementById('player-name').focus();
        } else {
            nameEntry.classList.add('hidden');
        }
    },

    saveScore() {
        const name = document.getElementById('player-name').value;
        const score = Game.state.score;
        const level = Game.state.currentLevel;

        if (name.trim()) {
            Scores.add(name, score, level);
            document.getElementById('name-entry').classList.add('hidden');
            document.getElementById('save-score-btn').disabled = true;
            document.getElementById('save-score-btn').textContent = 'SAVED!';
        }
    },

    // Victory
    showVictory(score, isHighScore) {
        this.showScreen('victory');
        document.getElementById('victory-score').textContent = `FINAL SCORE: ${score}`;

        const nameEntry = document.getElementById('victory-name-entry');
        if (isHighScore) {
            nameEntry.classList.remove('hidden');
            document.getElementById('victory-player-name').value = '';
            document.getElementById('victory-player-name').focus();
        } else {
            nameEntry.classList.add('hidden');
        }
    },

    saveVictoryScore() {
        const name = document.getElementById('victory-player-name').value;
        const score = Game.state.score;

        if (name.trim()) {
            Scores.add(name, score, Levels.count());
            document.getElementById('victory-name-entry').classList.add('hidden');
            document.getElementById('victory-save-score-btn').disabled = true;
            document.getElementById('victory-save-score-btn').textContent = 'SAVED!';
        }
    },

    // High scores
    showHighScores() {
        this.showScreen('highScores');
        this.populateScoresList();
    },

    populateScoresList() {
        const container = document.getElementById('scores-list');
        container.innerHTML = '';

        const scores = Scores.getAll();

        if (scores.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">No high scores yet!</p>';
            return;
        }

        scores.forEach((entry, index) => {
            const row = document.createElement('div');
            row.className = 'score-entry';

            const rank = document.createElement('span');
            rank.className = 'score-rank';
            rank.textContent = `#${index + 1}`;

            const name = document.createElement('span');
            name.className = 'score-name';
            name.textContent = entry.name;

            const score = document.createElement('span');
            score.className = 'score-value';
            score.textContent = entry.score.toLocaleString();

            row.appendChild(rank);
            row.appendChild(name);
            row.appendChild(score);
            container.appendChild(row);
        });
    },

    // Impact effects
    createImpactEffect(position) {
        // Create explosion particles on canvas
        Game.effects.push({
            type: 'explosion',
            x: position.x,
            y: position.y,
            radius: 5,
            maxRadius: 40,
            alpha: 1,
            createdAt: Date.now()
        });
    },

    // Score popup
    createScorePopup(x, y, points) {
        Game.effects.push({
            type: 'scorePopup',
            x,
            y,
            text: `+${points}`,
            alpha: 1,
            offsetY: 0,
            createdAt: Date.now()
        });
    }
};
