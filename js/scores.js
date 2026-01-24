// High Score Management
const Scores = {
    STORAGE_KEY: 'missileMayhem_highScores',
    MAX_SCORES: 10,
    scores: [],

    init() {
        this.load();
    },

    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.scores = JSON.parse(saved);
            } else {
                // Initialize with default scores
                this.scores = this.getDefaultScores();
                this.save();
            }
        } catch (e) {
            console.warn('Could not load high scores:', e);
            this.scores = this.getDefaultScores();
        }
    },

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.scores));
        } catch (e) {
            console.warn('Could not save high scores:', e);
        }
    },

    getDefaultScores() {
        return [
            { name: 'CAPTAIN', score: 5000, level: 6 },
            { name: 'MAJOR', score: 4000, level: 5 },
            { name: 'SOLDIER', score: 3000, level: 4 },
            { name: 'CADET', score: 2000, level: 3 },
            { name: 'ROOKIE', score: 1000, level: 2 }
        ];
    },

    // Check if score qualifies for high score board
    isHighScore(score) {
        if (this.scores.length < this.MAX_SCORES) return true;
        return score > this.scores[this.scores.length - 1].score;
    },

    // Add a new high score
    add(name, score, level) {
        // Sanitize name
        name = name.trim().toUpperCase().slice(0, 10) || 'PLAYER';

        const entry = {
            name,
            score,
            level,
            date: new Date().toISOString()
        };

        this.scores.push(entry);

        // Sort by score (highest first)
        this.scores.sort((a, b) => b.score - a.score);

        // Keep only top scores
        this.scores = this.scores.slice(0, this.MAX_SCORES);

        this.save();

        // Return rank (1-indexed)
        return this.scores.findIndex(s => s === entry) + 1;
    },

    // Get all scores
    getAll() {
        return [...this.scores];
    },

    // Get player's rank for a given score
    getRank(score) {
        for (let i = 0; i < this.scores.length; i++) {
            if (score > this.scores[i].score) {
                return i + 1;
            }
        }
        return this.scores.length + 1;
    },

    // Clear all scores (for testing)
    clear() {
        this.scores = [];
        this.save();
    },

    // Reset to default scores
    reset() {
        this.scores = this.getDefaultScores();
        this.save();
    }
};

// Game progress storage
const GameProgress = {
    STORAGE_KEY: 'missileMayhem_progress',
    data: {
        highestLevel: 1,
        unlockedVehicles: ['jeep'],
        unlockedProjectiles: ['cupcake', 'pizza'],
        unlockedBackgrounds: ['backyard'],
        totalScore: 0,
        gamesPlayed: 0
    },

    init() {
        this.load();
    },

    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.data = { ...this.data, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Could not load game progress:', e);
        }
    },

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not save game progress:', e);
        }
    },

    // Unlock items based on completed level
    unlockForLevel(level) {
        let newUnlocks = [];

        // Update highest level
        if (level > this.data.highestLevel) {
            this.data.highestLevel = level;
        }

        // Check vehicle unlocks
        Object.values(Vehicles.types).forEach(v => {
            if (v.unlockLevel <= level && !this.data.unlockedVehicles.includes(v.id)) {
                this.data.unlockedVehicles.push(v.id);
                newUnlocks.push({ type: 'vehicle', item: v });
            }
        });

        // Check projectile unlocks
        Object.values(Projectiles.types).forEach(p => {
            if (p.unlockLevel <= level && !this.data.unlockedProjectiles.includes(p.id)) {
                this.data.unlockedProjectiles.push(p.id);
                newUnlocks.push({ type: 'projectile', item: p });
            }
        });

        // Check background unlocks
        Object.values(Backgrounds.types).forEach(b => {
            if (b.unlockLevel <= level && !this.data.unlockedBackgrounds.includes(b.id)) {
                this.data.unlockedBackgrounds.push(b.id);
                newUnlocks.push({ type: 'background', item: b });
            }
        });

        this.save();
        return newUnlocks;
    },

    isVehicleUnlocked(id) {
        return true; // All vehicles always available
    },

    isProjectileUnlocked(id) {
        return true; // All projectiles always available
    },

    isBackgroundUnlocked(id) {
        return true; // All backgrounds always available
    },

    isLevelUnlocked(level) {
        return level <= this.data.highestLevel + 1;
    },

    isLevelCompleted(level) {
        return level <= this.data.highestLevel;
    },

    addToTotalScore(score) {
        this.data.totalScore += score;
        this.data.gamesPlayed++;
        this.save();
    },

    // Reset all progress (for testing)
    reset() {
        this.data = {
            highestLevel: 1,
            unlockedVehicles: ['jeep'],
            unlockedProjectiles: ['cupcake', 'pizza'],
            unlockedBackgrounds: ['backyard'],
            totalScore: 0,
            gamesPlayed: 0
        };
        this.save();
    }
};
