// Army Guy Mascot System
const ArmyGuy = {
    dialog: null,
    sprite: null,
    messageEl: null,
    continueBtn: null,
    callback: null,

    messages: {
        win: [
            "Outstanding soldier! You demolished those targets!",
            "Mission accomplished! High five!",
            "Wow! You're the best missile commander I've ever seen!",
            "Incredible shooting, cadet! You're a natural!",
            "BOOM! That's what I call destruction!",
            "Amazing work! Those targets didn't stand a chance!",
            "You're ready for the big leagues, soldier!",
            "Perfect aim! I'm so proud of you!",
            "That was EPIC! Let's keep this going!",
            "Hoo-ah! You crushed it out there!"
        ],

        lose: [
            "Good effort, cadet! Every soldier has tough days!",
            "Almost had 'em! Want to try again, champ?",
            "Don't give up! I believe in you, soldier!",
            "Hey, that was close! One more try?",
            "Even the best soldiers need practice! You've got this!",
            "Shake it off, cadet! Victory is just around the corner!",
            "Those targets got lucky! Let's show them who's boss!",
            "Keep your chin up! I've seen worse... well, okay, but still!",
            "Remember: it's not about falling down, it's about getting back up!",
            "You're learning! Every miss makes you stronger!"
        ],

        levelIntro: {
            1: "Welcome, new recruit! Let's start with some easy targets!",
            2: "Nice work completing level 1! Now try these jiggly towers!",
            3: "You're getting good! Watch out for those grumpy veggies!",
            4: "Halfway there! The aliens won't know what hit 'em!",
            5: "Almost to the end! Birthday cakes incoming!",
            6: "FINAL MISSION! Those rubber ducks are tough, but you're tougher!"
        },

        victory: [
            "YOU DID IT! You're the greatest missile commander EVER!",
            "INCREDIBLE! You beat all the levels! I'm crying happy tears!",
            "THE WORLD IS SAVED! Thanks to you, brave soldier!",
            "LEGENDARY! Your name will go down in history!",
            "AMAZING! I've never seen anyone as talented as you!"
        ],

        gameOver: [
            "Game Over, but what a journey! Ready for another adventure?",
            "That's all your lives, but you fought bravely! Try again?",
            "The targets won this time... but I know you can beat them!"
        ]
    },

    init() {
        this.dialog = document.getElementById('army-guy-dialog');
        this.sprite = document.getElementById('army-guy-sprite');
        this.messageEl = document.getElementById('army-guy-message');
        this.continueBtn = document.getElementById('army-guy-continue');

        this.continueBtn.addEventListener('click', () => this.hide());
    },

    show(type, levelNum = null) {
        return new Promise((resolve) => {
            this.callback = resolve;

            // Set sprite emoji
            this.sprite.textContent = this.getEmoji(type);

            // Set message
            const message = this.getMessage(type, levelNum);
            this.messageEl.textContent = message;

            // Set button text
            this.continueBtn.textContent = this.getButtonText(type);

            // Show dialog
            this.dialog.classList.remove('hidden');
        });
    },

    hide() {
        this.dialog.classList.add('hidden');
        if (this.callback) {
            this.callback();
            this.callback = null;
        }
    },

    getEmoji(type) {
        switch (type) {
            case 'win':
            case 'victory':
                return '🎖️';
            case 'lose':
            case 'gameOver':
                return '💪';
            case 'levelIntro':
                return '🪖';
            default:
                return '🎖️';
        }
    },

    getMessage(type, levelNum) {
        switch (type) {
            case 'win':
                return this.getRandomMessage(this.messages.win);
            case 'lose':
                return this.getRandomMessage(this.messages.lose);
            case 'victory':
                return this.getRandomMessage(this.messages.victory);
            case 'gameOver':
                return this.getRandomMessage(this.messages.gameOver);
            case 'levelIntro':
                return this.messages.levelIntro[levelNum] || this.messages.levelIntro[1];
            default:
                return "Keep up the great work, soldier!";
        }
    },

    getButtonText(type) {
        switch (type) {
            case 'win':
                return 'NEXT LEVEL!';
            case 'lose':
                return 'TRY AGAIN!';
            case 'victory':
                return 'CELEBRATE!';
            case 'gameOver':
                return 'OKAY';
            case 'levelIntro':
                return 'LET\'S GO!';
            default:
                return 'CONTINUE';
        }
    },

    getRandomMessage(messages) {
        return messages[Math.floor(Math.random() * messages.length)];
    },

    // Quick tip messages for during gameplay
    tips: [
        "Aim for the base to topple structures!",
        "Try bouncy projectiles for tricky angles!",
        "Heavy bombs work great on stacks!",
        "The moon has low gravity - aim higher!"
    ],

    getRandomTip() {
        return this.tips[Math.floor(Math.random() * this.tips.length)];
    }
};
