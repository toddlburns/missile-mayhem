// Level Configurations
const Levels = {
    configs: [
        // Level 1: Cardboard Robots
        {
            id: 1,
            name: 'Cardboard Robots',
            description: 'Wobbly box robots with googly eyes!',
            theme: 'robots',
            background: 'backyard',
            missiles: 6,
            minScore: 100,
            targets: [
                // Simple stacked boxes
                { x: 0.6, y: 0.85, w: 60, h: 60, emoji: '🤖', health: 80, points: 20 },
                { x: 0.65, y: 0.75, w: 50, h: 50, emoji: '🤖', health: 60, points: 15 },
                { x: 0.7, y: 0.85, w: 60, h: 60, emoji: '🤖', health: 80, points: 20 },

                // Tower
                { x: 0.8, y: 0.85, w: 40, h: 80, emoji: '📦', health: 100, points: 10, color: '#C9A66B' },
                { x: 0.8, y: 0.65, w: 50, h: 50, emoji: '🤖', health: 70, points: 25 },
            ],
            platforms: [
                // No extra platforms for level 1
            ]
        },

        // Level 2: Jello Towers
        {
            id: 2,
            name: 'Jello Towers',
            description: 'Jiggly colorful jello stacks!',
            theme: 'jello',
            background: 'backyard',
            missiles: 6,
            minScore: 200,
            targets: [
                // Jello tower 1
                { x: 0.55, y: 0.85, w: 50, h: 40, emoji: '🟩', health: 50, points: 15, restitution: 0.7 },
                { x: 0.55, y: 0.75, w: 45, h: 35, emoji: '🟨', health: 45, points: 15, restitution: 0.7 },
                { x: 0.55, y: 0.67, w: 40, h: 30, emoji: '🟥', health: 40, points: 20, restitution: 0.7 },

                // Jello tower 2
                { x: 0.7, y: 0.85, w: 55, h: 45, emoji: '🟦', health: 55, points: 15, restitution: 0.7 },
                { x: 0.7, y: 0.73, w: 50, h: 40, emoji: '🟪', health: 50, points: 20, restitution: 0.7 },
                { x: 0.7, y: 0.63, w: 45, h: 35, emoji: '🟧', health: 45, points: 25, restitution: 0.7 },

                // Bridge jello
                { x: 0.625, y: 0.55, w: 100, h: 25, emoji: '🍮', health: 60, points: 30, restitution: 0.8 },
            ],
            platforms: []
        },

        // Level 3: Grumpy Vegetables
        {
            id: 3,
            name: 'Grumpy Vegetables',
            description: 'Angry veggies in wooden crates!',
            theme: 'vegetables',
            background: 'desert',
            missiles: 6,
            minScore: 300,
            targets: [
                // Ground veggies with crates
                { x: 0.5, y: 0.85, w: 50, h: 50, emoji: '📦', health: 80, points: 5, color: '#8B4513' },
                { x: 0.5, y: 0.73, w: 40, h: 40, emoji: '🥕', health: 40, points: 20 },

                { x: 0.6, y: 0.85, w: 50, h: 50, emoji: '📦', health: 80, points: 5, color: '#8B4513' },
                { x: 0.65, y: 0.85, w: 50, h: 50, emoji: '📦', health: 80, points: 5, color: '#8B4513' },
                { x: 0.625, y: 0.73, w: 45, h: 45, emoji: '🍅', health: 35, points: 25 },

                { x: 0.75, y: 0.85, w: 55, h: 55, emoji: '📦', health: 90, points: 5, color: '#8B4513' },
                { x: 0.75, y: 0.7, w: 50, h: 50, emoji: '📦', health: 80, points: 5, color: '#8B4513' },
                { x: 0.75, y: 0.58, w: 40, h: 40, emoji: '🥦', health: 45, points: 30 },

                // Sneaky veggie
                { x: 0.85, y: 0.85, w: 35, h: 35, emoji: '🧅', health: 50, points: 35 },
            ],
            platforms: []
        },

        // Level 4: Sock Puppet Aliens
        {
            id: 4,
            name: 'Sock Puppet Aliens',
            description: 'Silly aliens in pillow forts!',
            theme: 'aliens',
            background: 'backyard',
            missiles: 6,
            minScore: 400,
            targets: [
                // Pillow fort base
                { x: 0.5, y: 0.85, w: 70, h: 40, emoji: '🛋️', health: 100, points: 10, color: '#9370DB' },
                { x: 0.58, y: 0.85, w: 70, h: 40, emoji: '🛋️', health: 100, points: 10, color: '#DDA0DD' },

                // Aliens
                { x: 0.54, y: 0.73, w: 35, h: 50, emoji: '👽', health: 50, points: 30 },

                // Second fort
                { x: 0.7, y: 0.85, w: 60, h: 50, emoji: '🧸', health: 70, points: 10 },
                { x: 0.78, y: 0.85, w: 60, h: 50, emoji: '🧸', health: 70, points: 10 },
                { x: 0.74, y: 0.7, w: 50, h: 40, emoji: '🛋️', health: 80, points: 10, color: '#87CEEB' },

                // Aliens on top
                { x: 0.7, y: 0.58, w: 30, h: 45, emoji: '👾', health: 45, points: 35 },
                { x: 0.78, y: 0.58, w: 30, h: 45, emoji: '👾', health: 45, points: 35 },

                // Lookout alien
                { x: 0.9, y: 0.85, w: 40, h: 55, emoji: '🛸', health: 60, points: 40 },
            ],
            platforms: []
        },

        // Level 5: Birthday Cake Towers
        {
            id: 5,
            name: 'Birthday Cake Towers',
            description: 'Stacked cakes with candles!',
            theme: 'cakes',
            background: 'snow',
            missiles: 6,
            minScore: 500,
            targets: [
                // Cake tower 1
                { x: 0.45, y: 0.85, w: 80, h: 30, emoji: '🎂', health: 70, points: 20 },
                { x: 0.45, y: 0.75, w: 65, h: 25, emoji: '🍰', health: 60, points: 20 },
                { x: 0.45, y: 0.67, w: 50, h: 20, emoji: '🧁', health: 50, points: 25 },
                { x: 0.45, y: 0.60, w: 30, h: 30, emoji: '🕯️', health: 30, points: 30 },

                // Cake tower 2 (taller)
                { x: 0.65, y: 0.85, w: 90, h: 35, emoji: '🎂', health: 80, points: 20 },
                { x: 0.65, y: 0.73, w: 75, h: 30, emoji: '🍰', health: 70, points: 20 },
                { x: 0.65, y: 0.63, w: 60, h: 25, emoji: '🧁', health: 60, points: 25 },
                { x: 0.65, y: 0.55, w: 45, h: 20, emoji: '🍰', health: 50, points: 25 },
                { x: 0.65, y: 0.48, w: 35, h: 35, emoji: '🕯️', health: 35, points: 35 },

                // Side cupcakes
                { x: 0.82, y: 0.85, w: 40, h: 40, emoji: '🧁', health: 45, points: 25 },
                { x: 0.88, y: 0.85, w: 40, h: 40, emoji: '🧁', health: 45, points: 25 },
            ],
            platforms: []
        },

        // Level 6: Giant Rubber Ducks (Boss Level)
        {
            id: 6,
            name: 'Giant Rubber Ducks',
            description: 'BOSS LEVEL - Huge rubber ducks!',
            theme: 'ducks',
            background: 'moon',
            missiles: 6,
            minScore: 600,
            targets: [
                // Mini ducks as defense
                { x: 0.45, y: 0.85, w: 40, h: 40, emoji: '🦆', health: 60, points: 20 },
                { x: 0.52, y: 0.85, w: 40, h: 40, emoji: '🦆', health: 60, points: 20 },

                // Medium duck
                { x: 0.6, y: 0.82, w: 60, h: 60, emoji: '🦆', health: 100, points: 35 },

                // Platform
                { x: 0.72, y: 0.78, w: 120, h: 20, health: 150, points: 10, color: '#4A90A4', isStatic: false },

                // Big ducks on platform
                { x: 0.68, y: 0.68, w: 50, h: 50, emoji: '🦆', health: 80, points: 30 },
                { x: 0.76, y: 0.68, w: 50, h: 50, emoji: '🦆', health: 80, points: 30 },

                // BOSS DUCK
                { x: 0.85, y: 0.75, w: 100, h: 100, emoji: '🦆', health: 200, points: 100 },

                // Tiny duck army
                { x: 0.9, y: 0.85, w: 30, h: 30, emoji: '🐤', health: 40, points: 15 },
                { x: 0.95, y: 0.85, w: 30, h: 30, emoji: '🐤', health: 40, points: 15 },
            ],
            platforms: []
        }
    ],

    // Get level config by number (1-indexed)
    get(levelNum) {
        return this.configs[levelNum - 1] || this.configs[0];
    },

    // Get total number of levels
    count() {
        return this.configs.length;
    },

    // Create targets for a level (converts relative positions to absolute)
    createTargets(levelNum, canvasWidth, canvasHeight) {
        const config = this.get(levelNum);
        const targets = [];

        config.targets.forEach(t => {
            const x = t.x * canvasWidth;
            const y = t.y * canvasHeight;
            const w = t.w || 40;
            const h = t.h || 40;

            targets.push({
                x,
                y,
                width: w,
                height: h,
                emoji: t.emoji,
                health: t.health || 50,
                points: t.points || 10,
                color: t.color,
                restitution: t.restitution || 0.2,
                density: t.density || 0.002,
                isStatic: t.isStatic || false,
                size: Math.max(w, h)
            });
        });

        return targets;
    },

    // Create platforms/static bodies for a level
    createPlatforms(levelNum, canvasWidth, canvasHeight) {
        const config = this.get(levelNum);
        const platforms = [];

        if (config.platforms) {
            config.platforms.forEach(p => {
                platforms.push({
                    x: p.x * canvasWidth,
                    y: p.y * canvasHeight,
                    width: p.w,
                    height: p.h,
                    color: p.color || '#8B4513'
                });
            });
        }

        return platforms;
    }
};
