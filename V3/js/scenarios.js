/*
 * Scenario data and rule engine.
 * Loaded by index.html in the browser and by tests/solve.js in Node.
 *
 * Scenario fields:
 *   title          tab label
 *   capacity       seats in the boat
 *   vehicleName    optional, default "Row Boat"
 *   actionVerb     optional, default "Row Across"
 *   requireTorch   optional, the item with role "torch" must ride every trip
 *   trackTime      optional, each trip costs the slowest passenger's minutes
 *   timeLimit      optional, target minutes when trackTime is on
 *   characters     [{ id, name, abbr, type, emoji, canRow, role?, pairId?, ownedBy?, minutes?, seat? }]
 *                  seat: false means the item rides along without using a seat
 *   rulesText      lines shown in the Rules tab
 *   conflicts      [{ ruleType, ...fields, message }] checked on the bank the boat just left
 *                  ruleType: predator_prey | owner_absent | majority | jealous_couples | chief_required
 *
 * After editing, run: node V3/tests/solve.js
 */

const SCENARIOS = {
  mwgc: {
    title: "1. Wolf, Goat & Cabbage",
    capacity: 2,
    characters: [
      { id: "man", name: "Farmer", abbr: "F", type: "human", emoji: "👨‍🌾", canRow: true },
      { id: "wolf", name: "Wolf", abbr: "W", type: "animal", emoji: "🐺", canRow: false },
      { id: "goat", name: "Goat", abbr: "G", type: "animal", emoji: "🐐", canRow: false },
      { id: "cabbage", name: "Cabbage", abbr: "C", type: "object", emoji: "🥬", canRow: false }
    ],
    rulesText: [
      "Wolf (W) eats Goat (G) if left together without Farmer (F).",
      "Goat (G) eats Cabbage (C) if left together without Farmer (F).",
      "Boat holds up to 2 items.",
      "Farmer (F) must be in the boat to row it."
    ],
    conflicts: [
      { ruleType: "predator_prey", predatorId: "wolf", victimId: "goat", protectorId: "man", message: "The Wolf ate the Goat!" },
      { ruleType: "predator_prey", predatorId: "goat", victimId: "cabbage", protectorId: "man", message: "The Goat ate the Cabbage!" }
    ]
  },

  "3m3d": {
    title: "2. 3 Men & 3 Dogs",
    capacity: 3,
    characters: [
      { id: "m1", name: "Man 1", abbr: "M1", type: "human", emoji: "🧔", canRow: true, ownerOf: "d1" },
      { id: "m2", name: "Man 2", abbr: "M2", type: "human", emoji: "👨", canRow: true, ownerOf: "d2" },
      { id: "m3", name: "Man 3", abbr: "M3", type: "human", emoji: "👴", canRow: true, ownerOf: "d3" },
      { id: "d1", name: "Dog 1", abbr: "D1", type: "animal", emoji: "🐕", canRow: false, ownedBy: "m1" },
      { id: "d2", name: "Dog 2", abbr: "D2", type: "animal", emoji: "🐩", canRow: false, ownedBy: "m2" },
      { id: "d3", name: "Dog 3", abbr: "D3", type: "animal", emoji: "🐕‍🦺", canRow: false, ownedBy: "m3" }
    ],
    rulesText: [
      "Dogs (D1, D2, D3) bite other men if their owner is absent.",
      "Dogs are completely friendly with each other.",
      "Boat has 3 seats and requires at least one Man to maneuver."
    ],
    conflicts: [
      { ruleType: "owner_absent", message: "A dog bit someone because their owner wasn't there!" }
    ]
  },

  missionaries: {
    title: "3. 3 Men & 3 Monsters",
    capacity: 2,
    characters: [
      { id: "m1", name: "Scholar 1", abbr: "M1", type: "human", role: "missionary", emoji: "🧙‍♂️", canRow: true },
      { id: "m2", name: "Scholar 2", abbr: "M2", type: "human", role: "missionary", emoji: "🧙", canRow: true },
      { id: "m3", name: "Scholar 3", abbr: "M3", type: "human", role: "missionary", emoji: "🧙‍♀️", canRow: true },
      { id: "c1", name: "Monster 1", abbr: "C1", type: "monster", role: "cannibal", emoji: "👹", canRow: true },
      { id: "c2", name: "Monster 2", abbr: "C2", type: "monster", role: "cannibal", emoji: "👺", canRow: true },
      { id: "c3", name: "Monster 3", abbr: "C3", type: "monster", role: "cannibal", emoji: "🧟", canRow: true }
    ],
    rulesText: [
      "If Monsters (C) ever outnumber Scholars (M) on either riverbank, the Scholars are eaten!",
      "Monsters only attack if at least one Scholar is present on that bank.",
      "The boat holds at most 2 people.",
      "Both Scholars and Monsters know how to row."
    ],
    conflicts: [
      { ruleType: "majority", predatorRole: "cannibal", preyRole: "missionary", message: "Monsters outnumbered and devoured the Scholars on the bank!" }
    ]
  },

  couples: {
    title: "4. Jealous Couples",
    capacity: 2,
    characters: [
      { id: "h1", name: "Husband 1", abbr: "H1", type: "human", role: "husband", pairId: "w1", emoji: "🤵", canRow: true },
      { id: "w1", name: "Wife 1", abbr: "W1", type: "human", role: "wife", pairId: "h1", emoji: "👰", canRow: true },
      { id: "h2", name: "Husband 2", abbr: "H2", type: "human", role: "husband", pairId: "w2", emoji: "👨‍💼", canRow: true },
      { id: "w2", name: "Wife 2", abbr: "W2", type: "human", role: "wife", pairId: "h2", emoji: "👩‍💼", canRow: true },
      { id: "h3", name: "Husband 3", abbr: "H3", type: "human", role: "husband", pairId: "w3", emoji: "🤴", canRow: true },
      { id: "w3", name: "Wife 3", abbr: "W3", type: "human", role: "wife", pairId: "h3", emoji: "👸", canRow: true }
    ],
    rulesText: [
      "No woman can be in the presence of another man unless her own husband is also present.",
      "Boat holds 2 people. Any adult can row.",
      "Watch both banks as the boat travels!"
    ],
    conflicts: [
      { ruleType: "jealous_couples", message: "A wife was left with another man without her husband present!" }
    ]
  },

  monks: {
    title: "5. Monks & Chief",
    capacity: 2,
    characters: [
      { id: "chief", name: "Chief Abbot", abbr: "CH", type: "human", role: "chief", emoji: "👑", canRow: true },
      { id: "mk1", name: "Elder Monk", abbr: "K1", type: "human", role: "monk", emoji: "🧘‍♂️", canRow: true },
      { id: "mk2", name: "Junior Monk", abbr: "K2", type: "human", role: "monk", emoji: "🧘", canRow: true },
      { id: "sp1", name: "Novice 1", abbr: "N1", type: "human", role: "novice", emoji: "👦", canRow: false },
      { id: "sp2", name: "Novice 2", abbr: "N2", type: "human", role: "novice", emoji: "👧", canRow: false }
    ],
    rulesText: [
      "Novices (N1, N2) cannot be left on a bank with Monks without the Chief Abbot (CH) present.",
      "Boat holds at most 2 people.",
      "Novices cannot row alone; a Monk or Chief must steer."
    ],
    conflicts: [
      { ruleType: "chief_required", chiefId: "chief", dependentRole: "novice", authoritiesRole: "monk", message: "Novices cannot be disciplined by Monks without the Chief Abbot present!" }
    ]
  },

  bridge: {
    title: "6. Torch & Bridge (Night)",
    capacity: 2,
    vehicleName: "Rope Bridge",
    actionVerb: "Cross Bridge",
    requireTorch: true,
    trackTime: true,
    timeLimit: 17,
    characters: [
      { id: "p1", name: "Spur (1m)", abbr: "1m", type: "human", minutes: 1, emoji: "🏃", canRow: true },
      { id: "p2", name: "Runner (2m)", abbr: "2m", type: "human", minutes: 2, emoji: "🚶", canRow: true },
      { id: "p5", name: "Stroller (5m)", abbr: "5m", type: "human", minutes: 5, emoji: "🧓", canRow: true },
      { id: "p10", name: "Slowpoke (10m)", abbr: "10m", type: "human", minutes: 10, emoji: "🐢", canRow: true },
      { id: "torch", name: "Torch", abbr: "🔥", type: "object", role: "torch", minutes: 0, emoji: "🔦", canRow: false, seat: false }
    ],
    rulesText: [
      "Four people must cross the rickety rope bridge at night.",
      "Bridge holds at most 2 people (the Torch rides along for free).",
      "The Torch (🔥) MUST accompany every crossing!",
      "When two cross, they move at the speed of the slower person.",
      "Target: Get everyone across in 17 minutes or less!"
    ],
    conflicts: []
  },

  custom: {
    title: "7. Custom Setup",
    capacity: 2,
    characters: [
      { id: "p1", name: "Alice", abbr: "A", type: "human", emoji: "👩", canRow: true },
      { id: "p2", name: "Cat", abbr: "C", type: "animal", emoji: "🐱", canRow: false },
      { id: "p3", name: "Fish", abbr: "F", type: "animal", emoji: "🐟", canRow: false }
    ],
    rulesText: [
      "Cat (C) eats Fish (F) without Alice (A).",
      "Boat holds up to 2 items.",
      "Alice must row the boat."
    ],
    conflicts: [
      { ruleType: "predator_prey", predatorId: "p2", victimId: "p3", protectorId: "p1", message: "Cat (C) harmed Fish (F) because Alice (A) was missing!" }
    ]
  }
};

/* ---------- Rule engine ---------- */

// Items that take a boat seat. Items with seat: false ride along for free.
function seatsNeeded(items) {
  return items.filter(c => c.seat !== false).length;
}

// Why these passengers cannot make a trip, or null if they can.
function crossingProblem(scn, passengers) {
  if (passengers.length === 0) return "Put someone in the boat first!";
  if (seatsNeeded(passengers) > scn.capacity) return "Too many passengers for the boat!";
  if (!passengers.some(c => c.canRow)) return "You need at least one capable person to make the trip!";
  if (scn.requireTorch && !passengers.some(c => c.role === "torch")) return "The Torch (🔦) must be carried across!";
  return null;
}

// What one trip costs: 1 turn, or the slowest passenger's minutes when time is tracked.
function crossingCost(scn, passengers) {
  if (!scn.trackTime) return 1;
  return Math.max(0, ...passengers.map(c => c.minutes || 0));
}

const CONFLICT_CHECKS = {
  predator_prey(bank, rule) {
    const has = id => bank.some(c => c.id === id);
    if (has(rule.predatorId) && has(rule.victimId) && !(rule.protectorId && has(rule.protectorId))) {
      return { predatorId: rule.predatorId, victimId: rule.victimId };
    }
    return null;
  },

  owner_absent(bank) {
    const humans = bank.filter(c => c.type === "human");
    for (const dog of bank.filter(c => c.ownedBy)) {
      if (bank.some(c => c.id === dog.ownedBy)) continue;
      const victim = humans.find(h => h.id !== dog.ownedBy);
      if (victim) return { predatorId: dog.id, victimId: victim.id };
    }
    return null;
  },

  majority(bank, rule) {
    const predators = bank.filter(c => c.role === rule.predatorRole);
    const preys = bank.filter(c => c.role === rule.preyRole);
    if (preys.length > 0 && predators.length > preys.length) {
      return { predatorId: predators[0].id, victimId: preys[0].id };
    }
    return null;
  },

  jealous_couples(bank) {
    const husbands = bank.filter(c => c.role === "husband");
    for (const wife of bank.filter(c => c.role === "wife")) {
      if (bank.some(c => c.id === wife.pairId)) continue;
      const otherHusband = husbands.find(h => h.id !== wife.pairId);
      if (otherHusband) return { predatorId: otherHusband.id, victimId: wife.id };
    }
    return null;
  },

  chief_required(bank, rule) {
    const hasChief = bank.some(c => c.id === rule.chiefId || c.role === "chief");
    const dependent = bank.find(c => c.role === rule.dependentRole);
    const authority = bank.find(c => c.role === rule.authoritiesRole);
    if (dependent && authority && !hasChief) {
      return { predatorId: authority.id, victimId: dependent.id };
    }
    return null;
  }
};

// First broken rule on a bank, as { predatorId, victimId, message } or null.
function evaluateBankConflict(bank, scn) {
  for (const rule of scn.conflicts || []) {
    const check = CONFLICT_CHECKS[rule.ruleType];
    const hit = check ? check(bank, rule) : null;
    if (hit) return { ...hit, message: rule.message || "Conflict occurred!" };
  }
  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SCENARIOS, crossingProblem, crossingCost, evaluateBankConflict, seatsNeeded };
}
