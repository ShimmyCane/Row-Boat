// Default fallback scenarios embedded in case fetch is blocked on file:// protocol
const DEFAULT_SCENARIOS = {
  mwgc: {
    title: "1. Wolf, Goat & Cabbage",
    capacity: 2,
    characters: [
      { id: 'man', name: 'Farmer', abbr: 'F', type: 'human', emoji: '👨‍🌾', canRow: true },
      { id: 'wolf', name: 'Wolf', abbr: 'W', type: 'animal', emoji: '🐺', canRow: false },
      { id: 'goat', name: 'Goat', abbr: 'G', type: 'animal', emoji: '🐐', canRow: false },
      { id: 'cabbage', name: 'Cabbage', abbr: 'C', type: 'object', emoji: '🥬', canRow: false }
    ],
    rulesText: [
      "Wolf (W) eats Goat (G) if left together without Farmer (F).",
      "Goat (G) eats Cabbage (C) if left together without Farmer (F).",
      "Boat holds up to 2 items.",
      "Farmer (F) must be in the boat to row it."
    ],
    conflicts: [
      { predatorId: 'wolf', victimId: 'goat', protectorId: 'man', message: "The Wolf ate the Goat!" },
      { predatorId: 'goat', victimId: 'cabbage', protectorId: 'man', message: "The Goat ate the Cabbage!" }
    ]
  },
  "3m3d": {
    title: "2. Three Men & Three Dogs",
    capacity: 3,
    characters: [
      { id: 'm1', name: 'Man 1', abbr: 'M1', type: 'human', emoji: '🧔', canRow: true, ownerOf: 'd1' },
      { id: 'm2', name: 'Man 2', abbr: 'M2', type: 'human', emoji: '👨', canRow: true, ownerOf: 'd2' },
      { id: 'm3', name: 'Man 3', abbr: 'M3', type: 'human', emoji: '👴', canRow: true, ownerOf: 'd3' },
      { id: 'd1', name: 'Dog 1', abbr: 'D1', type: 'animal', emoji: '🐕', canRow: false, ownedBy: 'm1' },
      { id: 'd2', name: 'Dog 2', abbr: 'D2', type: 'animal', emoji: '🐩', canRow: false, ownedBy: 'm2' },
      { id: 'd3', name: 'Dog 3', abbr: 'D3', type: 'animal', emoji: '🐕‍🦺', canRow: false, ownedBy: 'm3' }
    ],
    rulesText: [
      "Dogs (D1, D2, D3) bite other men if their owner is absent.",
      "Dogs are completely friendly with each other.",
      "Boat has 3 seats and requires at least one Man to maneuver."
    ],
    conflicts: [
      { predatorType: 'dog', victimType: 'man', ownerAbsent: true, message: "A dog bit someone because their owner wasn't there!" }
    ]
  },
  custom: {
    title: "3. Custom Setup",
    capacity: 2,
    characters: [
      { id: 'p1', name: 'Alice', abbr: 'A', type: 'human', emoji: '👩', canRow: true },
      { id: 'p2', name: 'Cat', abbr: 'C', type: 'animal', emoji: '🐱', canRow: false },
      { id: 'p3', name: 'Fish', abbr: 'F', type: 'animal', emoji: '🐟', canRow: false }
    ],
    rulesText: [
      "Cat (C) eats Fish (F) without Alice (A).",
      "Boat holds up to 2 items.",
      "Alice must row the boat."
    ],
    conflicts: [
      { predatorId: 'p2', victimId: 'p3', protectorId: 'p1', message: "Cat (C) harmed Fish (F) because Alice (A) was missing!" }
    ]
  }
};

let SCENARIOS = JSON.parse(JSON.stringify(DEFAULT_SCENARIOS));

/**
 * Universal evaluator for bank conflicts based on scenario configuration
 */
function evaluateBankConflict(bankItems, scn) {
  if (!scn.conflicts) return null;

  for (const rule of scn.conflicts) {
    // 1. Direct predator / victim / protector rule
    if (rule.predatorId && rule.victimId) {
      const hasPred = bankItems.some(i => i.id === rule.predatorId);
      const hasPrey = bankItems.some(i => i.id === rule.victimId);
      const hasProt = rule.protectorId ? bankItems.some(i => i.id === rule.protectorId) : false;

      if (hasPred && hasPrey && !hasProt) {
        return {
          predatorId: rule.predatorId,
          victimId: rule.victimId,
          message: rule.message || "Conflict occurred!"
        };
      }
    }

    // 2. Owner absent rule (Dogs & Men scenario)
    if (rule.ownerAbsent) {
      const dogs = bankItems.filter(i => (i.id && i.id.startsWith('d')) || i.type === 'animal');
      const men = bankItems.filter(i => (i.id && i.id.startsWith('m')) || i.type === 'human');

      for (const dog of dogs) {
        const owner = dog.ownedBy;
        const ownerPresent = owner ? bankItems.some(i => i.id === owner) : false;
        if (!ownerPresent && men.length > 0) {
          const victim = men[0];
          return {
            predatorId: dog.id,
            victimId: victim.id,
            message: `${dog.name} (${dog.abbr}) bit ${victim.name} (${victim.abbr}) because their owner wasn't there!`
          };
        }
      }
    }
  }

  return null;
}

/**
 * Load external scenario.json if available
 */
async function loadScenarios() {
  try {
    const res = await fetch('scenario.json');
    if (res.ok) {
      const data = await res.json();
      if (data && data.scenarios) {
        SCENARIOS = data.scenarios;
      }
    }
  } catch (err) {
    console.warn("Using embedded default scenarios (file:// or offline):", err);
  }
}
