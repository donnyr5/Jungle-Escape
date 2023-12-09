# JUNGLE ESCAPE

## Team Members
- Donovan Rimer - donnyr5@ucla.edu (UID: 105766869)
- Kaylee Tran - kayleetran@ucla.edu (UID: 00701816)
- Joseph Janssen - joeyj11@ucla.edu (UID: 905797640)

## Goal/Inspiration
Jungle Escape is inspired by classic mobile games such as Temple Run and Subway Surfers. It features a 3-path road with obstacles that players can dodge by moving left, right, or jumping. The aim is to achieve the highest score possible while avoiding getting caught in the jungle!

As the game progresses, the speed of the approaching obstacles increases, adding to the challenge. Players can boost their scores with coins or power-ups:
- **Coins**: Increase score by 10 points.
- **Diamonds**: Grant 8 seconds of invincibility.
- **Green Arrows**: Provide 5 jump boosts, allowing the player to double-jump.

## Controls
- Click anywhere on the screen to start the game.
- `a`: Move player left.
- `d`: Move player right.
- `p`: Pause the game.
- `m`: Toggle music.
- `r`: End the game.
- [space]: Jump (press twice for double jump).

## Features
- **3D Collision Detection** (Donovan): Stumps and rocks are lethal, while power-ups are beneficial. Uses `boxesCollide3D()` to check for collisions.
- **Power-Ups**:
  - **Jump Boost**: +5 double-jumps (Donovan).
  - **Invincibility**: 8-second immunity to death (Donovan).
  - **Coin**: +10 points each (Donovan).
- **Score Velocity**: Increases over time; displayed on-screen (Kaylee).
- **High Score**: Displayed on the home screen (Donovan).
- **Click to Start**: Initiate game with a click (Donovan).
- **Interpolated Movement**: Smooth left and right movement (Donovan).

## Special Implementations
- **Randomly Generated Items** (Kaylee, Donovan): Stumps, rocks, and power-ups have unique spawn chances.
- **Object Matrix Translation**: Moves in the +z direction based on current velocity (Donny, Kaylee).
- **Pausing**: Freezes objects and timers (Donovan).
- **Graphics**:
  - Background mapping and landing page (Donovan).
  - Textures and materials for power-ups and obstacles (Joseph).
- **Sounds**: Background music and power-up sounds, with toggle option (Donovan).

## Progress since Mid-Way Demo
Significant enhancements include:
- Addition of coins and invincibility power-ups.
- Reworked jump boost to allow double jumping.
- Implemented game speed tiers.
- Introduced music, sound effects, and pause feature.
- Revamped graphics with colorful textures.
- Added a path background for better perspective.
- Implemented a game over screen.
- High score display on the home screen.

## Future Updates
Planned features include:
- Turns in the path for 90-degree rotations.
- Overhead trees requiring players to duck.
- Moving snakes across the path.
- Visual effects for power-ups.

## Gallery
### Landing Page
(Insert image here)

### Game Play
(Insert image here)

### Death Screen
(Insert image here)
