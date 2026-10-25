// River Cross: game state, rowing animation, landing, and UI.
// Rules live in scenarios.js. This file only moves people and draws them.

const TRAVEL_MS = 900;   // boat crossing time
const PREP_MS = 350;     // pause before the boat leaves the bank
const STEP_MS = 280;     // gap between passengers stepping off
const STEP_OFF_MS = 600; // one step-off animation
const SIDES = ["left", "right"];

let scenarioKey = "mwgc";
let state = null;        // live game state
let undoStack = [];      // { before: state, move } for each crossing so far
let busy = false;        // true while an animation is playing
let timers = [];
let flashTimer = null;
let customSeq = 0;

// ---------- Small helpers ----------

const $ = id => document.getElementById(id);
const scn = () => SCENARIOS[scenarioKey];
const clone = value => JSON.parse(JSON.stringify(value));
const other = side => (side === "left" ? "right" : "left");
const bankName = side => (side === "left" ? "Left Bank" : "Right Bank");
const isPortrait = () => window.matchMedia("(max-aspect-ratio: 1/1)").matches;
const findChar = id => scn().characters.find(c => c.id === id);

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function later(fn, ms) {
  timers.push(setTimeout(fn, ms));
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

// ---------- Game state ----------

function freshState() {
  return {
    boat: "left",
    banks: { left: clone(scn().characters), right: [] },
    inBoat: [],
    turns: 0,
    minutes: 0,
    over: false,
    won: false,
    conflict: null,
    lastAshoreId: null
  };
}

function newGame(key) {
  clearTimers();
  clearTimeout(flashTimer);
  busy = false;
  scenarioKey = key;
  state = freshState();
  undoStack = [];

  document.querySelectorAll(".scenario-btn").forEach(b => {
    b.setAttribute("aria-pressed", String(b.dataset.key === key));
  });
  if (key === "custom") renderBuild();
  if (key !== "custom" && isTabActive("build")) setTab("rules");

  renderRules();
  renderAll();
  setStatus(scn().trackTime
    ? "Lead the group across with the Torch! Each trip takes the time of the slower person."
    : hint());
}

function isTabActive(name) {
  return document.querySelector(`.tab[data-tab="${name}"]`).classList.contains("active");
}

// What to do next, shown when nothing else is happening
function hint() {
  const s = scn();
  if (state.inBoat.length === 0) {
    return `Tap a character on the ${bankName(state.boat)} to board the boat.`;
  }
  return crossingProblem(s, state.inBoat) || `Ready! Tap ${s.actionVerb || "Row Across"} to sail.`;
}

// ---------- Actions ----------

function onChipTap(id, where) {
  if (busy || state.over) return;
  const char = findChar(id);
  if (!char) return;

  if (where === "boat") {
    unload(char);
  } else {
    board(char, where);
  }
  renderAll();
}

function board(char, where) {
  if (where !== state.boat) {
    return flash(`The boat is on the ${bankName(state.boat)} right now!`);
  }
  if (char.seat !== false && seatsNeeded(state.inBoat) >= scn().capacity) {
    return flash("The boat is full! Tap someone in the boat to unload them.");
  }
  state.banks[where] = state.banks[where].filter(c => c.id !== char.id);
  state.inBoat.push(char);
}

function unload(char) {
  state.inBoat = state.inBoat.filter(c => c.id !== char.id);
  state.banks[state.boat].push(char);
}

function rowAcross() {
  if (busy || state.over) return;
  const s = scn();
  const passengers = state.inBoat;
  const problem = crossingProblem(s, passengers);
  if (problem) return flash(problem);

  const from = state.boat;
  const to = other(from);
  const cost = crossingCost(s, passengers);
  const move = {
    from,
    to,
    cost,
    passengers: clone(passengers),
    before: { banks: clone(state.banks), inBoat: clone(passengers) },
    after: null,
    won: false,
    conflict: null
  };
  undoStack.push({ before: clone(state), move });

  state.turns += 1;
  state.minutes += cost;
  state.boat = to;
  state.banks[to].push(...passengers);
  state.inBoat = [];

  // Check the bank the boat just left, now without the passengers
  state.conflict = evaluateBankConflict(state.banks[from], s);
  state.won = state.banks[to].length === s.characters.length;
  state.lastAshoreId = state.won ? passengers[passengers.length - 1].id : null;
  state.over = Boolean(state.conflict) || state.won;

  move.after = clone({ banks: state.banks });
  move.won = state.won;
  move.conflict = state.conflict;

  playCrossing(move);
}

function undo() {
  if (busy || undoStack.length === 0) return;
  state = clone(undoStack.pop().before);
  renderAll();
  setStatus(`↩ Undid the last crossing. ${hint()}`);
}

// Watch the last crossing and landing again. The game state does not change.
function replayLast() {
  const entry = undoStack[undoStack.length - 1];
  if (busy || !entry) return;
  setStatus("🎬 Replaying the last landing…");
  playCrossing(entry.move, { replay: true });
}

// ---------- Crossing animation ----------

// Plays the boat's trip, then the passengers stepping off. The game state is already updated.
function playCrossing(move, { replay = false } = {}) {
  clearTimers();
  busy = true;
  renderControls();

  renderFrame(move.before.banks, move.before.inBoat, move.from);
  setStatus(`🚣 Rowing to the ${bankName(move.to)}…`);

  later(() => {
    $("boat").classList.add("rowing");
    setBoatSide(move.to, true);
  }, PREP_MS);

  const landAt = PREP_MS + TRAVEL_MS;
  later(() => {
    $("boat").classList.remove("rowing");
    setStatus(`⚓ Landing on the ${bankName(move.to)}…`);
    renderSeats([]);
    renderBanks(move.after.banks, {
      arrival: move,
      lastId: move.won ? move.passengers[move.passengers.length - 1].id : null
    });
    setDock(move.to);
  }, landAt);

  const doneAt = landAt + (move.passengers.length - 1) * STEP_MS + STEP_OFF_MS + 150;
  later(() => finishCrossing(move, replay), doneAt);
}

function finishCrossing(move, replay) {
  busy = false;
  renderAll();
  if (replay || state.won || state.over) {
    refreshStatus();
    return;
  }
  const names = move.passengers.map(p => p.name).join(", ");
  setStatus(`Landed on the ${bankName(move.to)}: ${names}. ${hint()}`);
}

// Status for the current game state: win, game over, or the next hint
function refreshStatus() {
  if (state.won) return setStatus(winMessage(), "success");
  if (state.over) return showGameOver(state.conflict.message);
  setStatus(hint());
}

function winMessage() {
  const s = scn();
  const last = findChar(state.lastAshoreId);
  const lastText = last ? ` 🏁 Last ashore: ${last.name} ${last.emoji}` : "";
  if (s.trackTime) {
    const target = s.timeLimit || 17;
    const head = state.minutes <= target
      ? `🎉 BRILLIANT! Everyone crossed in ${state.minutes} minutes (target ≤${target}m)!`
      : `🎉 All crossed in ${state.minutes} minutes! Can you get to ≤${target}m?`;
    return head + lastText;
  }
  return `🎉 SUCCESS! Everyone crossed safely in ${state.turns} turns!${lastText}`;
}

function setBoatSide(side, animate) {
  const boat = $("boat");
  if (!animate) boat.classList.add("no-anim");
  boat.classList.toggle("at-left", side === "left");
  boat.classList.toggle("at-right", side === "right");
  if (!animate) {
    void boat.offsetWidth; // apply the position before the transition comes back
    boat.classList.remove("no-anim");
  }
}

function setDock(side) {
  $("bankLeft").classList.toggle("dock", side === "left");
  $("bankRight").classList.toggle("dock", side === "right");
}

// ---------- Rendering ----------

function renderAll() {
  const s = scn();
  $("vehicleLabel").textContent = s.vehicleName || "Row Boat";
  $("capacityLabel").textContent = `${s.capacity} seat${s.capacity > 1 ? "s" : ""}`;
  $("btnRow").textContent = `${s.requireTorch ? "🔦" : "🛶"} ${s.actionVerb || "Row Across"}`;
  $("tabBuild").hidden = scenarioKey !== "custom";

  renderFrame(state.banks, state.inBoat, state.boat, {
    lastId: state.won ? state.lastAshoreId : null,
    conflict: state.over ? state.conflict : null
  });
  renderHistory();
  renderControls();
}

function renderFrame(banks, inBoat, boatSide, opts = {}) {
  renderBanks(banks, opts);
  renderSeats(inBoat);
  setBoatSide(boatSide, false);
  setDock(boatSide);
}

function renderBanks(banks, { arrival = null, lastId = null, conflict = null } = {}) {
  for (const side of SIDES) {
    const chips = banks[side].map(char => {
      const chip = makeChip(char, side);
      const idx = arrival && arrival.to === side
        ? arrival.passengers.findIndex(p => p.id === char.id)
        : -1;
      if (idx >= 0) animateArrival(chip, idx, side);
      if (char.id === lastId) chip.classList.add("last-ashore");
      return chip;
    });
    $(side === "left" ? "slotsLeft" : "slotsRight").replaceChildren(...chips);
    $(side === "left" ? "countLeft" : "countRight").textContent = banks[side].length;
  }

  if (conflict) {
    markChip(conflict.predatorId, "eating");
    markChip(conflict.victimId, "slashed");
  }
}

function animateArrival(chip, idx, side) {
  // Passengers step off toward the bank, from the side the boat came from
  const dir = side === "right" ? -1 : 1;
  const dist = 90;
  chip.classList.add("arriving");
  chip.style.setProperty("--delay", `${idx * STEP_MS}ms`);
  chip.style.setProperty(isPortrait() ? "--dy" : "--dx", `${dir * dist}px`);
}

function markChip(id, className) {
  const chip = document.querySelector(`.bank [data-id="${CSS.escape(id)}"]`);
  if (chip) chip.classList.add(className);
}

function renderSeats(inBoat) {
  const s = scn();
  $("boat").style.setProperty("--seats", s.capacity);

  const seated = inBoat.filter(c => c.seat !== false);
  const extras = inBoat.filter(c => c.seat === false);

  const seats = [];
  for (let i = 0; i < s.capacity; i++) {
    const seat = el("div", seated[i] ? "seat filled" : "seat");
    if (seated[i]) seat.append(makeChip(seated[i], "boat"));
    seats.push(seat);
  }
  $("seats").replaceChildren(...seats);
  $("extras").replaceChildren(...extras.map(c => makeChip(c, "boat")));
}

function makeChip(char, where) {
  const chip = el("button", `chip ${char.type}${where === "boat" ? " in-boat" : ""}`);
  chip.type = "button";
  chip.dataset.id = char.id;
  chip.title = char.name;
  chip.setAttribute("aria-label", `${char.name}. ${where === "boat" ? "Tap to unload" : "Tap to board"}`);
  chip.append(
    el("span", "abbr", char.abbr || char.name[0]),
    el("span", "emoji", char.emoji),
    el("span", "name", char.name)
  );
  if (char.canRow) chip.append(el("span", "rower", "🚣"));
  chip.addEventListener("click", () => onChipTap(char.id, where));
  return chip;
}

function renderControls() {
  const s = scn();
  const ready = !busy && !state.over && crossingProblem(s, state.inBoat) === null;
  const hasMoves = undoStack.length > 0;

  $("btnRow").disabled = !ready;
  $("btnUndo").disabled = busy || !hasMoves;
  $("btnReplay").disabled = busy || !hasMoves;
  $("btnReset").disabled = busy;
  $("btnTryAgain").hidden = busy || !state.over || state.won;
  $("turnDisplay").textContent = s.trackTime
    ? `${state.minutes} min · T${state.turns}`
    : `Turns: ${state.turns}`;

  document.querySelectorAll(".scenario-btn").forEach(b => { b.disabled = busy; });
}

function setStatus(msg, tone = "normal") {
  $("statusBanner").className = `status ${tone}`;
  $("statusText").textContent = msg;
}

function showGameOver(message) {
  $("statusBanner").className = "status alert";
  $("statusText").replaceChildren(
    el("span", "game-over", "GAME OVER!"),
    document.createTextNode(` ${message}`)
  );
}

function flash(msg) {
  setStatus(msg, "alert");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    if (!busy && !state.over) setStatus(hint());
  }, 2400);
}

// ---------- Rules & move history panels ----------

function renderRules() {
  $("ruleList").replaceChildren(...scn().rulesText.map(t => el("div", "rule", `⚠️ ${t}`)));
}

function renderHistory() {
  const list = $("historyList");
  if (undoStack.length === 0) {
    list.replaceChildren(el("p", "muted", "No moves yet."));
    return;
  }
  list.replaceChildren(...undoStack.map((entry, i) => historyCard(entry.move, i + 1)));
  list.scrollTop = list.scrollHeight;
}

function historyCard(move, n) {
  const card = el("div", "hist");

  const head = el("div", "hist-head");
  head.append(el("span", "hist-num", `T${n}`));
  if (scn().trackTime) head.append(el("span", "hist-time", `+${move.cost} min`));
  head.append(el("span", "hist-dir", move.to === "right" ? "→" : "←"));

  const boat = el("div", "hist-boat");
  move.passengers.forEach(p => boat.append(tag(p)));

  const banks = el("div", "hist-banks");
  banks.append(bankCol("L", move.after.banks.left), bankCol("R", move.after.banks.right));

  card.append(head, boat, banks);
  return card;
}

function bankCol(label, chars) {
  const col = el("div", "bank-col");
  col.append(el("b", "", `${label}:`));
  if (chars.length === 0) col.append(el("span", "muted", "—"));
  chars.forEach(c => col.append(tag(c)));
  return col;
}

function tag(p) {
  const node = el("span", `tag ${p.type}`, `${p.emoji} ${p.abbr || p.name[0]}`);
  node.title = p.name;
  return node;
}

// ---------- Side panel ----------

function setTab(name) {
  document.querySelectorAll(".tab").forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".panel").forEach(p => {
    p.classList.toggle("active", p.dataset.panel === name);
  });
  if (name === "history") renderHistory();
}

function toggleSheet(open) {
  const side = $("side");
  side.classList.toggle("open", open ?? !side.classList.contains("open"));
}

// ---------- Custom builder ----------

const DEFAULT_EMOJI = { human: "🧑", animal: "🐾", object: "📦" };

function renderBuild() {
  const s = SCENARIOS.custom;
  $("customCap").value = s.capacity;

  $("customChips").replaceChildren(...s.characters.map(c => {
    const tagNode = el("span", "custom-tag", `${c.emoji} ${c.abbr || c.name[0]} ${c.name}`);
    const remove = el("button", "", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${c.name}`);
    remove.addEventListener("click", () => removeCustomChar(c.id));
    tagNode.append(remove);
    return tagNode;
  }));

  ["rulePredator", "rulePrey", "ruleProtector"].forEach(id => {
    $(id).replaceChildren(...s.characters.map(c => new Option(`${c.abbr || c.name[0]} · ${c.name}`, c.id)));
  });
}

function addCustomChar() {
  const name = $("charName").value.trim();
  if (!name) return flash("Give your character a name first.");
  const type = $("charType").value;
  const abbr = ($("charAbbr").value.trim() || name[0]).toUpperCase();
  const emoji = $("charEmoji").value.trim() || DEFAULT_EMOJI[type];

  SCENARIOS.custom.characters.push({
    id: `c${++customSeq}`,
    name,
    abbr,
    type,
    emoji,
    canRow: type === "human"
  });
  $("charName").value = "";
  $("charAbbr").value = "";
  $("charEmoji").value = "";
  renderBuild();
}

function removeCustomChar(id) {
  const s = SCENARIOS.custom;
  s.characters = s.characters.filter(c => c.id !== id);
  s.conflicts = s.conflicts.filter(rule =>
    ![rule.predatorId, rule.victimId, rule.protectorId].includes(id)
  );
  rebuildCustomRules();
  renderRules();
  renderBuild();
}

function addCustomRule() {
  const s = SCENARIOS.custom;
  const predId = $("rulePredator").value;
  const preyId = $("rulePrey").value;
  const protId = $("ruleProtector").value;
  if (!predId || !preyId || predId === preyId) {
    return flash("Pick two different characters for the danger rule.");
  }
  if (!protId || protId === predId || protId === preyId) {
    return flash("Pick someone else to keep them safe.");
  }

  const rule = {
    ruleType: "predator_prey",
    predatorId: predId,
    victimId: preyId,
    protectorId: protId,
    message: `${findCustom(predId).name} harmed ${findCustom(preyId).name} because ${findCustom(protId).name} was missing!`
  };
  s.conflicts.push(rule);
  rebuildCustomRules();
  renderRules();
  setStatus(`Rule added: ${describeRule(rule)}`);
}

function findCustom(id) {
  return SCENARIOS.custom.characters.find(c => c.id === id);
}

function describeRule(rule) {
  const p = findCustom(rule.predatorId);
  const v = findCustom(rule.victimId);
  const k = findCustom(rule.protectorId);
  return `${p.abbr} harms ${v.abbr} without ${k.abbr}.`;
}

function rebuildCustomRules() {
  const s = SCENARIOS.custom;
  s.rulesText = [
    ...s.conflicts.map(describeRule),
    `Boat holds up to ${s.capacity} ${s.capacity > 1 ? "items" : "item"}.`,
    "Someone who can row must be in the boat."
  ];
}

function applyCustom() {
  const s = SCENARIOS.custom;
  s.capacity = Math.min(5, Math.max(1, parseInt($("customCap").value, 10) || 2));
  if (s.characters.length < 2) return flash("Add at least two characters first.");
  rebuildCustomRules();
  newGame("custom");
}

// ---------- Boot ----------

function buildTabs() {
  const box = $("scenarioTabs");
  Object.keys(SCENARIOS).forEach(key => {
    const btn = el("button", "scenario-btn", SCENARIOS[key].title);
    btn.type = "button";
    btn.dataset.key = key;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => newGame(key));
    box.append(btn);
  });
}

function boot() {
  buildTabs();

  $("btnRow").addEventListener("click", rowAcross);
  $("btnUndo").addEventListener("click", undo);
  $("btnReplay").addEventListener("click", replayLast);
  $("btnReset").addEventListener("click", () => newGame(scenarioKey));
  $("btnTryAgain").addEventListener("click", () => newGame(scenarioKey));
  $("btnInfo").addEventListener("click", () => toggleSheet());
  $("btnSideClose").addEventListener("click", () => toggleSheet(false));
  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => setTab(t.dataset.tab));
  });
  $("btnAddChar").addEventListener("click", addCustomChar);
  $("btnAddRule").addEventListener("click", addCustomRule);
  $("btnLaunch").addEventListener("click", applyCustom);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") toggleSheet(false);
  });

  newGame("mwgc");
}

boot();
