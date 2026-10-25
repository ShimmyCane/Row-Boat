// Checks that every scenario can be solved with the same rules the game uses.
// Usage: node V3/tests/solve.js
const { SCENARIOS, crossingProblem, crossingCost, evaluateBankConflict } = require("../js/scenarios.js");

// Cheapest sequence of trips from "everyone left, boat left" to "everyone right".
function solve(scn) {
  const chars = scn.characters;
  const n = chars.length;
  const key = (locs, boat) => locs.join("") + boat;
  const start = { locs: chars.map(() => "L"), boat: "L" };

  const best = new Map([[key(start.locs, start.boat), 0]]);
  const open = [{ ...start, cost: 0, trips: [] }];

  while (open.length) {
    open.sort((a, b) => a.cost - b.cost);
    const cur = open.shift();
    if (cur.cost > best.get(key(cur.locs, cur.boat))) continue;
    if (cur.locs.every(loc => loc === "R")) return { cost: cur.cost, trips: cur.trips };

    const side = cur.boat;
    const other = side === "L" ? "R" : "L";
    const here = [];
    cur.locs.forEach((loc, i) => { if (loc === side) here.push(i); });

    // Every non-empty group of people standing on the boat's bank.
    for (let mask = 1; mask < 1 << here.length; mask++) {
      const riders = here.filter((_, bit) => mask & (1 << bit));
      const passengers = riders.map(i => chars[i]);
      if (crossingProblem(scn, passengers)) continue;

      const locs = cur.locs.slice();
      riders.forEach(i => { locs[i] = other; });

      // The bank the boat leaves must be safe once the riders are gone.
      const leftBehind = chars.filter((_, i) => locs[i] === side);
      if (evaluateBankConflict(leftBehind, scn)) continue;

      const cost = cur.cost + crossingCost(scn, passengers);
      const k = key(locs, other);
      if (cost < (best.get(k) ?? Infinity)) {
        best.set(k, cost);
        open.push({ locs, boat: other, cost, trips: [...cur.trips, passengers.map(c => c.abbr || c.name).join("+")] });
      }
    }
  }
  return null;
}

let failed = 0;
for (const [key, scn] of Object.entries(SCENARIOS)) {
  if (key === "custom") continue; // the custom setup is built by the player
  const result = solve(scn);
  if (!result) {
    failed++;
    console.log(`FAIL ${scn.title}: no solution`);
  } else {
    const unit = scn.trackTime ? "min" : "trips";
    console.log(`ok   ${scn.title}: ${result.cost} ${unit} (${result.trips.length} crossings)`);
  }
}

if (failed) {
  console.log(`\n${failed} scenario(s) cannot be solved.`);
  process.exit(1);
}
console.log("\nAll scenarios are solvable.");
