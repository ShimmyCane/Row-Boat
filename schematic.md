# River Cross — Schematic

## Files
- `index.html`: page structure. Header with scenario tabs, river stage, status line, action buttons, side panel.
- `css/style.css`: layouts, boat, characters, animations.
- `js/scenarios.js`: scenario data and the rule engine. Also used by the solver test.
- `js/app.js`: game state, trip animation, rendering, custom builder.
- `tests/solve.js`: confirms every scenario is solvable with the game's rules. Run `node tests/solve.js`.

## Game flow
1. Tap characters on the boat's bank to board. Tap a character in the boat to unload.
2. Tap **Row Across**. The boat leaves, rows, and arrives.
3. Passengers step off one at a time. The final landing shows a 🏁 LAST tag and names the last ashore.
4. The bank the boat left is checked for conflicts. A conflict shows the lunge and slash, then GAME OVER.
5. **Undo** reverses a trip. **Last Landing** replays the most recent trip and landing without changing the game.

## Layout
| Screen | Layout |
|---|---|
| Landscape (iPad, wide iPhone) | Left bank, river, right bank across the screen. Rules, History and Build panel is a fixed column on the right. |
| Portrait (iPhone, iPad upright) | Left bank on top, river across the middle, right bank at the bottom. The boat crosses vertically. The panel is a bottom sheet opened by **📖 Info**. |

Layout is chosen by CSS media queries (`max-aspect-ratio: 1/1`, and `min-width: 960px` for the wide column). Chip and boat sizes shrink on short screens.

## Animation timing (app.js)
- `PREP_MS` 350: pause before the boat leaves
- `TRAVEL_MS` 900: boat crossing
- `STEP_MS` 280: gap between passengers stepping off
- `STEP_OFF_MS` 600: one step-off animation

## Adding a scenario
Copy an entry in `js/scenarios.js`, give it a new key, and set `title`, `capacity`, `characters`, `rulesText` and `conflicts`. Then run `node tests/solve.js`. See the comment at the top of `scenarios.js` for every field.
