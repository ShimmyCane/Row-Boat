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
      { ruleType: 'predator_prey', predatorId: 'wolf', victimId: 'goat', protectorId: 'man', message: "The Wolf ate the Goat!" },
      { ruleType: 'predator_prey', predatorId: 'goat', victimId: 'cabbage', protectorId: 'man', message: "The Goat ate the Cabbage!" }
    ]
  },
  "3m3d": {
    title: "2. 3 Men & 3 Dogs",
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
      { ruleType: 'owner_absent', message: "A dog bit someone because their owner wasn't there!" }
    ]
  },
  missionaries: {
    title: "3. 3 Men & 3 Monsters",
    capacity: 2,
    characters: [
      { id: 'm1', name: 'Scholar 1', abbr: 'M1', type: 'human', role: 'missionary', emoji: '🧙‍♂️', canRow: true },
      { id: 'm2', name: 'Scholar 2', abbr: 'M2', type: 'human', role: 'missionary', emoji: '🧙', canRow: true },
      { id: 'm3', name: 'Scholar 3', abbr: 'M3', type: 'human', role: 'missionary', emoji: '🧙‍♀️', canRow: true },
      { id: 'c1', name: 'Monster 1', abbr: 'C1', type: 'monster', role: 'cannibal', emoji: '👹', canRow: true },
      { id: 'c2', name: 'Monster 2', abbr: 'C2', type: 'monster', role: 'cannibal', emoji: '👺', canRow: true },
      { id: 'c3', name: 'Monster 3', abbr: 'C3', type: 'monster', role: 'cannibal', emoji: '🧟', canRow: true }
    ],
    rulesText: [
      "If Monsters (C) ever outnumber Scholars (M) on either riverbank, the Scholars are eaten!",
      "Monsters only attack if at least one Scholar is present on that bank.",
      "The boat holds at most 2 people.",
      "Both Scholars and Monsters know how to row."
    ],
    conflicts: [
      { ruleType: 'majority', predatorRole: 'cannibal', preyRole: 'missionary', message: "Monsters outnumbered and devoured the Scholars on the bank!" }
    ]
  },
  couples: {
    title: "4. Jealous Couples",
    capacity: 2,
    characters: [
      { id: 'h1', name: 'Husband 1', abbr: 'H1', type: 'human', role: 'husband', pairId: 'w1', emoji: '🤵', canRow: true },
      { id: 'w1', name: 'Wife 1', abbr: 'W1', type: 'human', role: 'wife', pairId: 'h1', emoji: '👰', canRow: true },
      { id: 'h2', name: 'Husband 2', abbr: 'H2', type: 'human', role: 'husband', pairId: 'w2', emoji: '👨‍💼', canRow: true },
      { id: 'w2', name: 'Wife 2', abbr: 'W2', type: 'human', role: 'wife', pairId: 'h2', emoji: '👩‍💼', canRow: true },
      { id: 'h3', name: 'Husband 3', abbr: 'H3', type: 'human', role: 'husband', pairId: 'w3', emoji: '🤴', canRow: true },
      { id: 'w3', name: 'Wife 3', abbr: 'W3', type: 'human', role: 'wife', pairId: 'h3', emoji: '👸', canRow: true }
    ],
    rulesText: [
      "No woman can be in the presence of another man unless her own husband is also present.",
      "Boat holds 2 people. Any adult can row.",
      "Watch both banks as the boat travels!"
    ],
    conflicts: [
      { ruleType: 'jealous_couples', message: "A wife was left with another man without her husband present!" }
    ]
  },
  monks: {
    title: "5. Monks & Chief",
    capacity: 2,
    characters: [
      { id: 'chief', name: 'Chief Abbot', abbr: 'CH', type: 'human', role: 'chief', emoji: '👑', canRow: true },
      { id: 'mk1', name: 'Elder Monk', abbr: 'K1', type: 'human', role: 'monk', emoji: '🧘‍♂️', canRow: true },
      { id: 'mk2', name: 'Junior Monk', abbr: 'K2', type: 'human', role: 'monk', emoji: '🧘', canRow: true },
      { id: 'sp1', name: 'Novice 1', abbr: 'N1', type: 'human', role: 'novice', emoji: '👦', canRow: false },
      { id: 'sp2', name: 'Novice 2', abbr: 'N2', type: 'human', role: 'novice', emoji: '👧', canRow: false }
    ],
    rulesText: [
      "Novices (N1, N2) cannot be left on a bank with Monks without the Chief Abbot (CH) present.",
      "Boat holds at most 2 people.",
      "Novices cannot row alone; a Monk or Chief must steer."
    ],
    conflicts: [
      { ruleType: 'chief_required', chiefId: 'chief', dependentRole: 'novice', authoritiesRole: 'monk', message: "Novices cannot be disciplined by Monks without the Chief Abbot present!" }
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
      { id: 'p1', name: 'Spur (1m)', abbr: '1m', type: 'human', minutes: 1, emoji: '🏃', canRow: true },
      { id: 'p2', name: 'Runner (2m)', abbr: '2m', type: 'human', minutes: 2, emoji: '🚶', canRow: true },
      { id: 'p5', name: 'Stroller (5m)', abbr: '5m', type: 'human', minutes: 5, emoji: '🧓', canRow: true },
      { id: 'p10', name: 'Slowpoke (10m)', abbr: '10m', type: 'human', minutes: 10, emoji: '🐢', canRow: true },
      { id: 'torch', name: 'Torch', abbr: '🔥', type: 'object', role: 'torch', minutes: 0, emoji: '🔦', canRow: false }
    ],
    rulesText: [
      "Four people must cross the rickety rope bridge at night.",
      "Bridge holds at most 2 people (plus the Torch).",
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
      { ruleType: 'predator_prey', predatorId: 'p2', victimId: 'p3', protectorId: 'p1', message: "Cat (C) harmed Fish (F) because Alice (A) was missing!" }
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
    const rType = rule.ruleType || (rule.predatorId ? 'predator_prey' : (rule.ownerAbsent ? 'owner_absent' : ''));

    // 1. Direct predator / victim / protector rule
    if (rType === 'predator_prey' && rule.predatorId && rule.victimId) {
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
    if (rType === 'owner_absent') {
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

    // 3. Majority rule (Missionaries & Cannibals / Scholars & Monsters)
    if (rType === 'majority') {
      const pRole = rule.predatorRole || 'cannibal';
      const vRole = rule.preyRole || 'missionary';
      const predators = bankItems.filter(i => i.role === pRole);
      const preys = bankItems.filter(i => i.role === vRole);

      if (preys.length > 0 && predators.length > preys.length) {
        return {
          predatorId: predators[0].id,
          victimId: preys[0].id,
          message: rule.message || `Monsters (${predators.length}) outnumbered Scholars (${preys.length}) on this bank!`
        };
      }
    }

    // 4. Jealous couples (No woman in presence of another man without her husband)
    if (rType === 'jealous_couples') {
      const husbands = bankItems.filter(i => i.role === 'husband');
      const wives = bankItems.filter(i => i.role === 'wife');

      for (const wife of wives) {
        const husbandId = wife.pairId;
        const husbandPresent = bankItems.some(i => i.id === husbandId);
        // If other men are on the bank and her husband is not present:
        const otherMen = husbands.filter(h => h.id !== husbandId);
        if (!husbandPresent && otherMen.length > 0) {
          return {
            predatorId: otherMen[0].id,
            victimId: wife.id,
            message: `${wife.name} (${wife.abbr}) cannot be stranded with ${otherMen[0].name} (${otherMen[0].abbr}) without ${wife.name}'s husband present!`
          };
        }
      }
    }

    // 5. Chief required (Novices cannot be with Monks without Chief)
    if (rType === 'chief_required') {
      const hasChief = bankItems.some(i => i.id === rule.chiefId || i.role === 'chief');
      const dependents = bankItems.filter(i => i.role === rule.dependentRole);
      const authorities = bankItems.filter(i => i.role === rule.authoritiesRole);

      if (dependents.length > 0 && authorities.length > 0 && !hasChief) {
        return {
          predatorId: authorities[0].id,
          victimId: dependents[0].id,
          message: rule.message || "Novices cannot be left with Monks without the Chief Abbot present!"
        };
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
