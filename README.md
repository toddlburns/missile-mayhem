# Missile Mayhem!

An Angry Birds-style physics game built with HTML5 Canvas and Matter.js.

## Play the Game

Simply open `index.html` in a modern web browser!

Or use a local server:
```bash
# Python 3
python -m http.server 8000

# Then visit http://localhost:8000
```

## Features

- 6 unique levels with wacky themes
- 4 unlockable military vehicles
- 8 different projectile types
- 4 selectable backgrounds (including Moon with low gravity!)
- Encouraging Army Guy mascot
- High score board with local storage
- Touch-friendly controls for mobile/tablet

## Controls

- **Aim**: Click/tap near the launcher and drag away
- **Power**: Drag distance = launch power
- **Fire**: Release to launch
- **Select Ammo**: Click ammo icons at bottom (or press 1-6)
- **Pause**: Press ESC or tap the pause button

## Level Themes

1. Cardboard Robots
2. Jello Towers
3. Grumpy Vegetables
4. Sock Puppet Aliens
5. Birthday Cake Towers
6. Giant Rubber Ducks (Boss Level!)

## Future iPad Conversion

To convert to an iPad app using Capacitor:

```bash
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios

npx cap init "Missile Mayhem" com.yourname.missilemayhem
npx cap add ios
npx cap copy
npx cap open ios
```

Then build and deploy using Xcode.

## Tech Stack

- HTML5 Canvas
- Vanilla JavaScript
- Matter.js (physics engine)
- Local Storage (scores & progress)
