# Row Boat Problem - Schematic

## Purpose
Animate row boat problems to visualize how many turns it takes to cross the river and what the process looks like.

## Context
There is a river that needs to be crossed, with a row boat that can only take a limited number of people/animals/things.

## Constraints & Rules
- Humans are required to maneuver the boat.
- Animals may act out if humans (or their specific human) are not present.

## Scenarios
1. **Man, Wolf, Goat, Cabbage**
   - **Rules**: Wolf and Goat listen to man. In the absence of man, Wolf eats Goat, and Goat eats Cabbage.
   - **Boat Capacity**: 2 seats.
2. **Three Men & Three Dogs**
   - **Characters**: M1, M2, M3 and D1, D2, D3.
   - **Rules**: Dogs bite men if their owner isn't present. Dogs are happy with each other.
   - **Boat Capacity**: 3 seats.
3. **Custom**
   - User can add their own characters and define relationships/conflict rules.

## Design & Layout (iPad Website Skill)
**Visuals**
- **Color Scheme**: Light pastel.
- **Graphics**: Simple but not overly wireframe. Bold lines, graphically interesting.
- **Responsiveness**: App fills viewport height (no page scroll). Independent column scrolling. On narrow screens, collapses to a single column (Play area first).

**Layout Structure**
- **Left Column (Play Area)**:
  - Fixed position, main play object (the river, riverbanks, and boat) always visible.
  - Draggable items (characters) that can be placed in the boat or on the riverbanks.
  - Bottom controls: Turn counter, Status (Success/Failure message), Undo button, Reset button.
- **Right Column (Reference & Controls)**:
  - Scrollable. Stacked panels with +/- toggles.
  - **Scenario Selection Panel**: Choose between Scenario 1, 2, or Custom.
  - **Custom Scenario Builder Panel**: Add characters, define conflicts, set boat capacity.
  - **Rules / Status Panel**: Current active rules, progress towards crossing.

**Settings & Decluttering**
- A gear icon on the lower right to open Settings.
- Hide secondary controls (like advanced custom rules or visual toggles) behind the Settings panel on smaller screens. Open by default on larger screens.
- Keep main interaction (dragging characters, moving boat) central and clear.
