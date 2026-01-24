// Projectile Definitions - All ridiculous and silly!
const Projectiles = {
    types: {
        cupcake: {
            id: 'cupcake',
            name: 'Cupcake',
            emoji: '🧁',
            size: 14,
            sizeClass: 'S',
            shape: 'circle',
            density: 0.0008,
            restitution: 0.2,
            friction: 0.1,
            speedMultiplier: 1.3,
            impactMultiplier: 0.7,
            trail: true,
            trailColor: 'rgba(255,182,193,0.6)',
            color: '#FF69B4',
            unlockLevel: 1,
            description: 'Sweet and speedy! Frosting fury!'
        },

        pizza: {
            id: 'pizza',
            name: 'Pizza Slice',
            emoji: '🍕',
            size: 18,
            sizeClass: 'M',
            shape: 'circle',
            density: 0.001,
            restitution: 0.3,
            friction: 0.1,
            speedMultiplier: 1.0,
            impactMultiplier: 1.0,
            trail: true,
            trailColor: 'rgba(255,200,50,0.5)',
            color: '#FFA500',
            unlockLevel: 1,
            description: 'Cheesy destruction! Extra toppings!'
        },

        pumpkin: {
            id: 'pumpkin',
            name: 'Pumpkin',
            emoji: '🎃',
            size: 28,
            sizeClass: 'L',
            shape: 'circle',
            density: 0.002,
            restitution: 0.1,
            friction: 0.2,
            speedMultiplier: 0.7,
            impactMultiplier: 1.8,
            trail: true,
            trailColor: 'rgba(255,140,0,0.5)',
            color: '#FF8C00',
            unlockLevel: 1,
            description: 'Spooky smashing! Heavy gourd!'
        },

        beachBall: {
            id: 'beachBall',
            name: 'Beach Ball',
            emoji: '🏐',
            size: 22,
            sizeClass: 'M',
            shape: 'circle',
            density: 0.0005,
            restitution: 0.9,
            friction: 0.05,
            speedMultiplier: 1.1,
            impactMultiplier: 0.6,
            bounces: 3,
            trail: false,
            color: '#00CED1',
            unlockLevel: 1,
            description: 'Boing boing boing! Summer vibes!'
        },

        watermelon: {
            id: 'watermelon',
            name: 'Watermelon',
            emoji: '🍉',
            size: 28,
            sizeClass: 'L',
            shape: 'circle',
            density: 0.0015,
            restitution: 0.2,
            friction: 0.3,
            speedMultiplier: 0.8,
            impactMultiplier: 1.3,
            trail: false,
            color: '#27AE60',
            unlockLevel: 1,
            description: 'SPLAT! Juicy explosion!',
            onHit: (projectile, target, physics) => {
                // Spawn smaller pieces
                const pos = projectile.body.position;
                const vel = projectile.body.velocity;
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 / 3) * i + Math.random() * 0.5;
                    const speed = 5 + Math.random() * 3;
                    setTimeout(() => {
                        physics.addProjectile(
                            pos.x,
                            pos.y,
                            Math.cos(angle) * speed + vel.x * 0.3,
                            Math.sin(angle) * speed + vel.y * 0.3,
                            {
                                emoji: '🍉',
                                size: 10,
                                color: '#27AE60',
                                density: 0.0008,
                                restitution: 0.3,
                                impactMultiplier: 0.4,
                                isFragment: true
                            }
                        );
                    }, 50);
                }
            }
        },

        rubberChicken: {
            id: 'rubberChicken',
            name: 'Rubber Chicken',
            emoji: '🐔',
            size: 22,
            sizeClass: 'S',
            shape: 'circle',
            density: 0.0004,
            restitution: 0.95,
            friction: 0.02,
            speedMultiplier: 1.2,
            impactMultiplier: 0.5,
            bounces: 5,
            trail: false,
            color: '#FFD700',
            unlockLevel: 1,
            description: 'BAWK BAWK! Totally unpredictable!'
        },

        giantDonut: {
            id: 'giantDonut',
            name: 'Giant Donut',
            emoji: '🍩',
            size: 30,
            sizeClass: 'L',
            shape: 'circle',
            density: 0.001,
            restitution: 0.4,
            friction: 0.8,
            speedMultiplier: 0.9,
            impactMultiplier: 1.2,
            trail: false,
            color: '#E91E63',
            unlockLevel: 1,
            description: 'Sprinkled destruction! Rolls everywhere!'
        },

        flyingToilet: {
            id: 'flyingToilet',
            name: 'Flying Toilet',
            emoji: '🚽',
            size: 35,
            sizeClass: 'XL',
            shape: 'circle',
            density: 0.003,
            restitution: 0.1,
            friction: 0.1,
            speedMultiplier: 0.6,
            impactMultiplier: 2.5,
            trail: true,
            trailColor: 'rgba(173,216,230,0.7)',
            color: '#ADD8E6',
            unlockLevel: 1,
            description: 'FLUSH OF DOOM! Maximum absurdity!'
        }
    },

    // Get projectile by ID
    get(id) {
        return this.types[id] || this.types.pizza;
    },

    // Get all unlocked projectiles for a level
    getUnlocked(currentLevel) {
        return Object.values(this.types).filter(p => p.unlockLevel <= currentLevel);
    },

    // Get projectile count for display
    getSizeIcon(sizeClass) {
        switch (sizeClass) {
            case 'S': return '•';
            case 'M': return '••';
            case 'L': return '•••';
            case 'XL': return '••••';
            default: return '••';
        }
    }
};

// Vehicle definitions
const Vehicles = {
    types: {
        jeep: {
            id: 'jeep',
            name: 'Army Jeep',
            emoji: '🚙',
            color: '#556B2F',
            unlockLevel: 1,
            powerMultiplier: 1.0,
            description: 'Your trusty starter vehicle!'
        },

        tank: {
            id: 'tank',
            name: 'Tank',
            emoji: '🛡️',
            color: '#4A5D23',
            unlockLevel: 1,
            powerMultiplier: 1.3,
            description: 'Stronger shots for bigger impacts!'
        },

        rocketTruck: {
            id: 'rocketTruck',
            name: 'Rocket Truck',
            emoji: '🚚',
            color: '#8B0000',
            unlockLevel: 1,
            powerMultiplier: 1.2,
            speedBonus: 1.3,
            description: 'Faster projectiles zoom to targets!'
        },

        artillery: {
            id: 'artillery',
            name: 'Artillery Cannon',
            emoji: '💪',
            color: '#2F4F4F',
            unlockLevel: 1,
            powerMultiplier: 1.5,
            blastRadius: 1.5,
            description: 'Biggest boom radius!'
        }
    },

    get(id) {
        return this.types[id] || this.types.jeep;
    },

    getUnlocked(currentLevel) {
        return Object.values(this.types).filter(v => v.unlockLevel <= currentLevel);
    }
};

// Background definitions
const Backgrounds = {
    types: {
        backyard: {
            id: 'backyard',
            name: 'Backyard',
            emoji: '🏡',
            unlockLevel: 1,
            gravity: { x: 0, y: 1 },
            description: 'Home sweet home!'
        },

        desert: {
            id: 'desert',
            name: 'Desert',
            emoji: '🏜️',
            unlockLevel: 1,
            gravity: { x: 0, y: 1 },
            description: 'Sandy dunes and cacti!'
        },

        snow: {
            id: 'snow',
            name: 'Snow',
            emoji: '❄️',
            unlockLevel: 1,
            gravity: { x: 0, y: 1 },
            description: 'Snowy hills and snowmen!'
        },

        moon: {
            id: 'moon',
            name: 'Moon',
            emoji: '🌙',
            unlockLevel: 1,
            gravity: { x: 0, y: 0.3 },
            description: 'Low gravity mayhem!'
        }
    },

    get(id) {
        return this.types[id] || this.types.backyard;
    },

    getUnlocked(currentLevel) {
        return Object.values(this.types).filter(b => b.unlockLevel <= currentLevel);
    }
};
