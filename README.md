# Tic-Tac-Toe Arena AI 

Create a responsive 2D browser-based escape game called "Escape the Haunted House" using React, HTML, CSS, and JavaScript.

Theme:

The game takes place inside a dark haunted house. The player is trapped and must collect three hidden keys, solve a simple door code puzzle, and escape before a ghost catches them.

Design:

- Dark horror-themed interface.

- Purple, black, and dark blue color palette.

- Modern UI with glowing buttons.

- Smooth animations and transitions.

- Mobile and desktop responsive.

- Display the game title "Escape the Haunted House" on the main menu.

Main Menu:

- Start Game

- Instructions

- About

- Exit (returns to main menu)

Game Layout:

Create a top-down 2D map with the following rooms connected by doors:

- Entrance

- Hall

- Library

- Kitchen

- Bedroom

- Storage Room

- Bathroom

- Exit Room

Player:

- Control the player using Arrow Keys or WASD.

- Display a small explorer character.

- Add smooth movement.

- Prevent walking through walls.

- Show a flashlight effect around the player.

Objectives:

- Collect 3 hidden keys.

- Display collected keys in an inventory bar.

- Show the current objective.

- Unlock the Exit Room only after collecting all three keys.

Puzzle:

After collecting all keys, show a simple puzzle:

"Enter the correct 4-digit code."

Hide clues in different rooms.

The correct code unlocks the exit door.

Ghost AI:

Create one ghost enemy with three states:

1. Patrol

- Walk randomly between rooms.

2. Detect

- If the player enters a detection radius, the ghost notices them.

3. Chase

- Chase the player using the shortest available path.

- If the player escapes for several seconds, the ghost returns to patrol.

Game Over:

If the ghost touches the player:

- Show a Game Over screen.

- Display the final score.

- Buttons:

  - Restart

  - Main Menu

Win Screen:

When the player escapes:

- Show "Congratulations! You Escaped!"

- Display:

  - Time Taken

  - Keys Collected

  - Final Score

- Button to play again.

Scoring:

- Key collected: +100 points

- Puzzle solved: +200 points

- Escape: +500 points

Timer:

Display a timer counting the total play time.

HUD:

Top of the screen should display:

- Score

- Keys Collected (0/3)

- Timer

- Current Objective

Audio:

- Creepy background music.

- Footstep sounds.

- Key collection sound.

- Door opening sound.

- Ghost sound while chasing.

- Win and Game Over sounds.

Include a mute/unmute button.

Animations:

- Smooth player movement.

- Ghost floating animation.

- Door opening animation.

- Key pickup animation.

- Screen shake when the ghost catches the player.

- Fade transitions between screens.

Code Quality:

- Organize the project into reusable React components.

- Use clean and well-commented code.

- Separate game logic from UI.

- Keep the project easy to understand for students.

Bonus Features:

- Pause menu.

- Save the highest score using browser local storage.

- Difficulty selection (Easy, Medium, Hard).

- Hint button that highlights the nearest uncollected key for a few seconds.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://eerie-key-quest.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d0830259-2397-446d-bd06-09a88b77e5c9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
