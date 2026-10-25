# River Cross (Row Boat) — Lessons Learned

Covers V1 and V2, which were deleted when V3 was built. Git history keeps the old code
(`git show 0c818c2:V2/js/app.js`, for example). Add new lessons at the bottom under a new date.

## Version history

| Version | What it had | Problems found later |
|---|---|---|
| V1 | 3 scenarios (Wolf/Goat/Cabbage, 3 Men & 3 Dogs, Custom). Two-column layout. Boat swapped banks instantly. Drag-and-drop boarding. Settings modal. | Layout assumed a wide screen. |
| V2 | 7 scenarios (adds 3 Men & 3 Monsters, Jealous Couples, Monks & Chief, Torch & Bridge). Scenario data moved to `scenario.json`. Vertical river, eating and slash animations, history timeline. | Bridge scenario could not be solved. Several smaller issues below. |
| V3 | One consolidated game. Same 7 scenarios. Fits iPhone and iPad in both orientations. Animated rowing, step-off landings, last-ashore highlight, replay of the last landing. | — |

## Bugs and mistakes found in V2

1. **The bridge puzzle could not be solved.** The torch counted as one of the two boat seats, so
   only one person could cross per trip. Found by brute-force solving the scenario with the
   same rules the game uses. The torch now rides without a seat (`seat: false`) and the solver
   confirms 17 minutes is reachable.
2. **Scenario data was stored twice.** `scenario.json` and a copy embedded in `scenarios.js`
   were kept in sync by hand, and `fetch('scenario.json')` fails when the page is opened from
   `file://`, so the embedded copy was the one actually used. V3 has one data file,
   `js/scenarios.js`.
3. **Dead settings.** The settings modal had "Real-time hazard warnings" and "Enable sound
   effects / vibrations" checkboxes that did nothing. V3 removes the modal. Build a control only
   when it does something.
4. **Drag-and-drop does not work on iPhone.** HTML5 drag events do not fire from touch on
   iPhone. Tap-to-board works everywhere, so V3 uses tap only.
5. **Fixed pixel sizes.** A 300px side column, 210px banks, and a 175px boat did not fit a phone
   screen. V3 uses a responsive grid, and on narrow screens the rules and history panel is a
   bottom sheet.
6. **`100vh` on iOS Safari** is taller than the visible area when the address bar shows. V3 uses
   `100dvh` with a `100vh` fallback.
7. **`user-scalable=no`** blocks pinch-zoom, which hurts people with low vision. V3 allows zoom.
   Tap targets use `touch-action: manipulation` so double-tap zoom does not interfere.
8. **Names were inserted with `innerHTML`.** Custom character names are typed by the user, so
   a name containing markup would break the page. V3 builds elements with `textContent`.
9. **The owner rule guessed roles from ID prefixes** (`id.startsWith('d')`). It breaks as soon as
   an ID changes. V3 uses explicit `ownedBy` fields.
10. **Removing a custom character left rules pointing at it.** V3 prunes conflicts when a
    character is removed and rebuilds the rules text from the rules.
11. **`alert()` for feedback** blocks the page on iPad. V3 shows messages in the status line.
12. **Duplicated docs drifted.** `index_summary.html` had hand-typed line counts that were
    already wrong. Docs for each version were copied. V3 keeps one `purpose.md` and one
    `schematic.md` and avoids line counts.

## Design decisions to keep

- Pastel palette, bold outlined characters with offset shadows, and a simple boat drawing.
  These came from the schematic and are still right.
- Tap a character on the boat's bank to board, tap a character in the boat to unload.
- The history timeline of trips, with each bank's contents after each trip.
- The eating lunge and slash on a conflict. It makes a game over easy to understand.
- Time tracking for the bridge puzzle (each trip costs the slowest walker's minutes).

## Architecture lessons (V3)

- **Rules and drawing are separate.** `scenarios.js` holds data and the rule engine
  (`crossingProblem`, `crossingCost`, `evaluateBankConflict`). `app.js` only moves people and
  draws. The solver test uses the same functions, so the game and the test cannot disagree.
- **State updates first, animation second.** A trip updates the game state immediately and
  stores before and after snapshots. `playCrossing` then renders the snapshots over time. Undo
  and "replay last landing" both work from the same snapshots.
- **Conflicts are checked on the bank the boat leaves**, after the passengers are removed. This
  is enough because every bank is checked at the moment the boat leaves it.
- **Phone layout:** banks sit above and below the river, and the boat crosses vertically. This
  gives the river the full screen height, which is the long axis on a phone. Landscape keeps the
  banks left and right.

## How to test changes

- `node tests/solve.js`: every scenario must be solvable. Run it after editing scenario data.
- Browser checks with Playwright: play a known solution on phone and iPad sizes and check for
  page errors and whole-page scrolling. A Playwright `newContext` needs
  `viewport: { width, height }`. Top-level `width` and `height` are ignored and the page falls
  back to 1280×720.
- Known limit: on iPhone landscape (short screen), a bank with six characters scrolls inside
  itself. The stage is about 160px tall there.

## Session lessons: consolidation and root move (2026-10-23 to 2026-10-25)

Process lessons from building V3 and moving it to the repo root. These are about how the work
was done, not about the game.

- **Check a screenshot's size before trusting what it shows.** The test browser ignored a
  viewport I passed at the wrong level, so every "phone" screenshot was really 1280×720 and
  looked like a desktop. Confirm the viewport with `innerWidth` or a measured layout first.
- **Measure layout, don't just look at images.** Bounding-box checks (`getBoundingClientRect`,
  `scrollHeight` against `innerHeight`) caught the real layout facts. The images were only
  confirmation.
- **Check every file after a multi-file `sed` or chain of `&&`.** One command in the chain
  failed on a `#` delimiter and the rest of the chain did not run. Re-grep for the old path
  after any rename or move (`grep -rn "V3/" --exclude-dir=.git .`).
- **Keep the entry point obvious.** After the old root copies were removed, the repo root held
  only `README.md`, and the app opened that file, which looked like the game had broken. A
  repo whose main page is a game should keep `index.html` at the root.
- **Draft PRs must be marked ready before merging.** `merge_pull_request` refused a draft.
  Pin the merge to the reviewed commit with `expectedHeadSha` so nothing unseen gets in.
- **A repo with no CI shows empty check runs.** Empty `get_check_runs` results mean no checks
  ran, not that they passed. Say so in the PR description and rely on the local tests.
- **Test the data, not just the UI.** The solver found the V2 bridge puzzle could not be
  solved, which browser clicks alone would not have shown. Run a solver for any rule-driven
  puzzle before shipping.
- **Subscription events are not CI results.** The PR notifications were subscription and
  merge events. Read the check runs and review threads directly rather than trusting the
  event text.
