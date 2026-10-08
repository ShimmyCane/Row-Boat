// --- APPLICATION STATE ---
let currentScenarioKey = 'mwgc';
let state = {
  boatPosition: 'left', // 'left' or 'right'
  leftBank: [],
  rightBank: [],
  inBoat: [],
  turns: 0,
  totalMinutes: 0,
  gameOver: false,
  won: false,
  history: [],
  historyLogs: []
};

// --- INITIALIZATION ---
function initGame(scenarioKey) {
  currentScenarioKey = scenarioKey;
  const scn = SCENARIOS[scenarioKey];
  if (!scn) return;

  // Build scenario buttons dynamically if needed
  renderScenarioButtons();

  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scenario === scenarioKey);
  });

  const vName = scn.vehicleName || 'Row Boat';
  const vVerb = scn.actionVerb || 'Row Across';
  document.getElementById('capacityLabel').textContent = `Cap: ${scn.capacity}`;
  const bLabel = document.querySelector('.boat-label');
  if (bLabel) bLabel.textContent = vName;
  const btnRow = document.getElementById('btnRow');
  if (btnRow) btnRow.innerHTML = scn.requireTorch ? `🔦 ${vVerb}` : `🛶 ${vVerb}`;

  state = {
    boatPosition: 'left',
    leftBank: JSON.parse(JSON.stringify(scn.characters)),
    rightBank: [],
    inBoat: [],
    turns: 0,
    totalMinutes: 0,
    gameOver: false,
    won: false,
    history: [],
    historyLogs: []
  };

  document.getElementById('customBuilderCard').style.display = scenarioKey === 'custom' ? 'block' : 'none';
  if (scenarioKey === 'custom') {
    renderCustomBuilder();
  }

  document.getElementById('btnTryAgain').style.display = 'none';

  renderRules();
  renderHistory();
  renderBoard();
  updateStatus(scn.trackTime
    ? "Lead the group across with the Torch! Each trip takes the time of the slower person."
    : "Tap or drag characters into the boat, then Row across!");
}

function renderScenarioButtons() {
  const container = document.getElementById('scenarioTabs');
  if (!container) return;

  // Render from current SCENARIOS keys
  container.innerHTML = '';
  Object.keys(SCENARIOS).forEach(key => {
    const scn = SCENARIOS[key];
    const btn = document.createElement('button');
    btn.className = `scenario-btn ${key === currentScenarioKey ? 'active' : ''}`;
    btn.dataset.scenario = key;
    btn.textContent = scn.title;
    btn.addEventListener('click', () => initGame(key));
    container.appendChild(btn);
  });
}

function resetCurrentGame() {
  initGame(currentScenarioKey);
}

// --- RENDER FUNCTIONS ---
function renderRules() {
  const scn = SCENARIOS[currentScenarioKey];
  const listEl = document.getElementById('ruleList');
  listEl.innerHTML = '';
  (scn.rulesText || []).forEach(txt => {
    const el = document.createElement('div');
    el.className = 'rule-pill';
    el.textContent = '⚠️ ' + txt;
    listEl.appendChild(el);
  });
}

function renderBoard() {
  const scn = SCENARIOS[currentScenarioKey];

  const boatEl = document.getElementById('boat');
  boatEl.className = `boat-container ${state.boatPosition}-bank`;

  // Render Left Bank (West)
  const slotsLeft = document.getElementById('slotsLeft');
  slotsLeft.innerHTML = '';
  state.leftBank.forEach(char => slotsLeft.appendChild(createCharElement(char, 'left')));
  document.getElementById('leftCount').textContent = state.leftBank.length;

  // Render Right Bank (East)
  const slotsRight = document.getElementById('slotsRight');
  slotsRight.innerHTML = '';
  state.rightBank.forEach(char => slotsRight.appendChild(createCharElement(char, 'right')));
  document.getElementById('rightCount').textContent = state.rightBank.length;

  // Render Boat Seats
  const boatSeats = document.getElementById('boatSeats');
  boatSeats.innerHTML = '';
  for (let i = 0; i < scn.capacity; i++) {
    const seatEl = document.createElement('div');
    seatEl.className = 'boat-seat';
    const charInSeat = state.inBoat[i];
    if (charInSeat) {
      seatEl.classList.add('filled');
      seatEl.appendChild(createCharElement(charInSeat, 'boat'));
    }
    boatSeats.appendChild(seatEl);
  }

  // Row / Cross button condition
  const hasRower = scn.requireTorch
    ? state.inBoat.some(c => c.canRow) && state.inBoat.some(c => c.id === 'torch')
    : state.inBoat.some(c => c.canRow);

  const btnRow = document.getElementById('btnRow');
  btnRow.disabled = state.gameOver || state.inBoat.length === 0 || !hasRower;

  // Turns / Time display
  if (scn.trackTime) {
    document.getElementById('turnDisplay').textContent = `${state.totalMinutes} min (T${state.turns})`;
  } else {
    document.getElementById('turnDisplay').textContent = `Turns: ${state.turns}`;
  }
}

function createCharElement(char, location) {
  const chip = document.createElement('div');
  chip.className = `char-chip ${char.type}`;
  chip.draggable = !state.gameOver;
  chip.id = `char-chip-${char.id}`;
  chip.dataset.charId = char.id;
  chip.dataset.location = location;

  chip.innerHTML = `
    <span class="abbr-tag">${char.abbr || char.name[0]}</span>
    <span class="emoji">${char.emoji}</span>
    <span class="name">${char.name}</span>
    ${char.canRow ? '<span class="rower-badge" title="Can Row">🚣</span>' : ''}
  `;

  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    handleCharTap(char, location);
  });

  chip.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: char.id, location: location }));
    chip.style.opacity = '0.5';
  });
  chip.addEventListener('dragend', () => {
    chip.style.opacity = '1';
  });

  return chip;
}

// --- INTERACTION LOGIC ---
function handleCharTap(char, location) {
  if (state.gameOver) return;
  const scn = SCENARIOS[currentScenarioKey];

  if (location === 'boat') {
    state.inBoat = state.inBoat.filter(c => c.id !== char.id);
    if (state.boatPosition === 'left') {
      state.leftBank.push(char);
    } else {
      state.rightBank.push(char);
    }
  } else if (location === state.boatPosition) {
    if (state.inBoat.length >= scn.capacity) {
      showToast("Boat is full! Row across or tap someone to unload.");
      return;
    }
    if (location === 'left') {
      state.leftBank = state.leftBank.filter(c => c.id !== char.id);
    } else {
      state.rightBank = state.rightBank.filter(c => c.id !== char.id);
    }
    state.inBoat.push(char);
  } else {
    showToast("The boat is on the opposite bank!");
    return;
  }

  renderBoard();
}

// --- ROWING THE BOAT / CROSSING ---
function rowBoat() {
  if (state.gameOver) return;
  const scn = SCENARIOS[currentScenarioKey];

  if (scn.requireTorch) {
    const hasTorch = state.inBoat.some(c => c.id === 'torch');
    if (!hasTorch) {
      showToast("The Torch (🔥) must be carried across!");
      return;
    }
  }

  const hasRower = state.inBoat.some(c => c.canRow);
  if (!hasRower) {
    showToast("You need at least one capable person to make the trip!");
    return;
  }

  // Calculate trip time if tracking time (slower person's pace)
  let tripMinutes = 0;
  if (scn.trackTime) {
    const people = state.inBoat.filter(c => c.minutes && c.minutes > 0);
    tripMinutes = people.length > 0 ? Math.max(...people.map(p => p.minutes)) : 0;
  }

  // Record history snapshot for undo
  state.history.push(JSON.parse(JSON.stringify({
    boatPosition: state.boatPosition,
    leftBank: state.leftBank,
    rightBank: state.rightBank,
    inBoat: state.inBoat,
    turns: state.turns,
    totalMinutes: state.totalMinutes,
    historyLogs: state.historyLogs
  })));

  const fromBank = state.boatPosition;
  const toBank = fromBank === 'left' ? 'right' : 'left';
  state.boatPosition = toBank;
  state.turns++;
  state.totalMinutes += tripMinutes;

  // Record Visual History Log Step with bank snapshots
  const logStep = {
    turn: state.turns,
    tripMinutes: tripMinutes,
    totalMinutes: state.totalMinutes,
    direction: toBank === 'right' ? 'right' : 'left', // 'right' for →, 'left' for ←
    passengers: state.inBoat.map(c => ({
      abbr: c.abbr || c.name[0],
      emoji: c.emoji,
      type: c.type,
      name: c.name
    })),
    leftBank: state.leftBank.map(c => ({
      abbr: c.abbr || c.name[0],
      emoji: c.emoji,
      type: c.type,
      name: c.name
    })),
    rightBank: state.rightBank.map(c => ({
      abbr: c.abbr || c.name[0],
      emoji: c.emoji,
      type: c.type,
      name: c.name
    }))
  };
  state.historyLogs.push(logStep); // ascending format (T1, T2, T3...)
  renderHistory();

  renderBoard();

  // Validate the bank that was left behind using scenarios evaluator
  const leftBehind = fromBank === 'left' ? state.leftBank : state.rightBank;
  const conflict = evaluateBankConflict(leftBehind, scn);

  if (conflict) {
    state.gameOver = true;
    document.getElementById('btnRow').disabled = true;

    triggerConflictAnimation(conflict);
    showGameOver(conflict.message);
    return;
  }

  // Check victory condition
  const totalChars = scn.characters.length;
  if (state.rightBank.length + (toBank === 'right' ? state.inBoat.length : 0) === totalChars) {
    state.gameOver = true;
    state.won = true;
    document.getElementById('btnRow').disabled = true;
    if (scn.trackTime) {
      const optimal = scn.timeLimit || 17;
      const perfect = state.totalMinutes <= optimal;
      updateStatus(perfect
        ? `🎉 BRILLIANT! Everyone crossed in ${state.totalMinutes} minutes (Target was ≤${optimal}m)!`
        : `🎉 All crossed safely in ${state.totalMinutes} minutes! Can you optimize to ≤${optimal}m?`, 'success');
    } else {
      updateStatus(`🎉 SUCCESS! Everyone crossed safely in ${state.turns} turns!`, 'success');
    }
    return;
  }

  updateStatus(scn.trackTime
    ? `Crossed in +${tripMinutes} min (Total: ${state.totalMinutes} min). Keep going!`
    : `Boat reached ${toBank === 'left' ? 'Left' : 'Right'} Bank safely.`);
}

// --- EATING / SLASH ANIMATION TRIGGER ---
function triggerConflictAnimation(conflict) {
  const victimEl = document.getElementById(`char-chip-${conflict.victimId}`);
  const predatorEl = document.getElementById(`char-chip-${conflict.predatorId}`);

  if (predatorEl) predatorEl.classList.add('eating-action');
  if (victimEl) victimEl.classList.add('slashed');
}

function showGameOver(conflictMessage) {
  const banner = document.getElementById('statusBanner');
  banner.className = 'status-banner alert';
  
  const wrapper = document.getElementById('statusTextWrapper');
  wrapper.innerHTML = `
    <span class="game-over-tag">GAME OVER!</span>
    <span style="font-weight:700">${conflictMessage}</span>
  `;

  document.getElementById('btnTryAgain').style.display = 'inline-flex';
}

function undoMove() {
  if (state.history.length === 0) {
    showToast("No moves to undo!");
    return;
  }
  const prev = state.history.pop();
  state.boatPosition = prev.boatPosition;
  state.leftBank = prev.leftBank;
  state.rightBank = prev.rightBank;
  state.inBoat = prev.inBoat;
  state.turns = prev.turns;
  state.totalMinutes = prev.totalMinutes || 0;
  state.historyLogs = prev.historyLogs || [];
  state.gameOver = false;
  state.won = false;

  document.getElementById('btnTryAgain').style.display = 'none';

  renderBoard();
  renderHistory();
  updateStatus("Undid last turn.");
}

function updateStatus(msg, type = 'normal') {
  const banner = document.getElementById('statusBanner');
  banner.className = `status-banner ${type}`;
  const wrapper = document.getElementById('statusTextWrapper');
  wrapper.innerHTML = `<span id="statusText">${msg}</span>`;
  if (type !== 'alert') {
    document.getElementById('btnTryAgain').style.display = 'none';
  }
}

function showToast(msg) {
  updateStatus(msg, 'alert');
  setTimeout(() => {
    if (!state.gameOver) updateStatus("Tap characters to board/unload, then Row!");
  }, 2500);
}

// --- VISUAL MOVE HISTORY RENDERING ---
function renderHistory() {
  const historyList = document.getElementById('historyList');
  if (state.historyLogs.length === 0) {
    historyList.innerHTML = '<em style="color:#94a3b8">No moves taken yet.</em>';
    return;
  }

  historyList.innerHTML = '';
  // state.historyLogs is in ascending order (T1, T2, T3...)
  state.historyLogs.forEach(step => {
    const card = document.createElement('div');
    card.className = 'history-step-card';

    const renderMiniTag = (p) => `
      <span class="history-tag ${p.type}" title="${p.name}">
        <span>${p.emoji}</span>
        <span>${p.abbr}</span>
      </span>
    `;

    const leftBankHtml = (step.leftBank && step.leftBank.length > 0)
      ? step.leftBank.map(renderMiniTag).join('')
      : '<span class="history-empty">—</span>';

    const boatHtml = (step.passengers && step.passengers.length > 0)
      ? step.passengers.map(renderMiniTag).join('')
      : '<span class="history-empty">—</span>';

    const rightBankHtml = (step.rightBank && step.rightBank.length > 0)
      ? step.rightBank.map(renderMiniTag).join('')
      : '<span class="history-empty">—</span>';

    // Arrow on left if moving left (←), arrow on right if moving right (→)
    const isMovingLeft = step.direction === 'left';
    const arrowLeftHtml = isMovingLeft
      ? '<span class="history-arrow left" title="Moving Left">←</span>'
      : '';
    const arrowRightHtml = !isMovingLeft
      ? '<span class="history-arrow right" title="Moving Right">→</span>'
      : '';

    const timeBadgeHtml = step.tripMinutes > 0
      ? `<span class="stat-pill" style="font-size:0.65rem;padding:1px 5px">+${step.tripMinutes}m (${step.totalMinutes}m)</span>`
      : '';

    card.innerHTML = `
      <div class="history-header-row">
        <div style="display:flex;align-items:center;gap:4px">
          <span class="history-step-num">T${step.turn}</span>
          ${timeBadgeHtml}
        </div>
        <div class="history-boat-action">
          ${arrowLeftHtml}
          <div class="history-passengers">${boatHtml}</div>
          ${arrowRightHtml}
        </div>
      </div>
      <div class="history-banks-row">
        <div class="history-bank-side left" title="Left Bank">
          <span class="bank-mini-label">L:</span>
          <div class="history-tags-wrap">${leftBankHtml}</div>
        </div>
        <div class="history-bank-side right" title="Right Bank">
          <span class="bank-mini-label">R:</span>
          <div class="history-tags-wrap">${rightBankHtml}</div>
        </div>
      </div>
    `;
    historyList.appendChild(card);
  });
  // Auto-scroll to latest move at the bottom in ascending order
  historyList.scrollTop = historyList.scrollHeight;
}

// --- SETUP DRAG & DROP TARGETS ---
function setupDragTargets() {
  const boatEl = document.getElementById('boat');
  const bankLeft = document.getElementById('bankLeft');
  const bankRight = document.getElementById('bankRight');

  [boatEl, bankLeft, bankRight].forEach(el => {
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.classList.add('drop-target');
    });
    el.addEventListener('dragleave', () => {
      el.classList.remove('drop-target');
    });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('drop-target');
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const char = findCharById(data.id);
        if (!char) return;

        if (el === boatEl) {
          if (data.location === state.boatPosition) handleCharTap(char, data.location);
        } else if (el === bankLeft && state.boatPosition === 'left' && data.location === 'boat') {
          handleCharTap(char, 'boat');
        } else if (el === bankRight && state.boatPosition === 'right' && data.location === 'boat') {
          handleCharTap(char, 'boat');
        }
      } catch (err) {}
    });
  });
}

function findCharById(id) {
  const scn = SCENARIOS[currentScenarioKey];
  return scn.characters.find(c => c.id === id);
}

// --- UI ACCORDION & PANELS ---
function togglePanel(id, headerEl) {
  const panel = document.getElementById(id);
  const toggle = headerEl.querySelector('.panel-toggle');
  panel.classList.toggle('collapsed');
  toggle.textContent = panel.classList.contains('collapsed') ? '+' : '−';
}

function toggleSettings(show) {
  const modal = document.getElementById('settingsModal');
  modal.classList.toggle('hidden', !show);
}

// --- CUSTOM SCENARIO BUILDER ---
function renderCustomBuilder() {
  const scn = SCENARIOS.custom;
  document.getElementById('customCapInput').value = scn.capacity;
  
  const chipsEl = document.getElementById('customChips');
  chipsEl.innerHTML = '';
  scn.characters.forEach(c => {
    const tag = document.createElement('span');
    tag.className = 'custom-char-tag';
    tag.innerHTML = `[${c.abbr || c.name[0]}] ${c.emoji} ${c.name} <button onclick="removeCustomChar('${c.id}')">&times;</button>`;
    chipsEl.appendChild(tag);
  });

  const pSelect = document.getElementById('rulePredator');
  const preySelect = document.getElementById('rulePrey');
  const protSelect = document.getElementById('ruleProtector');
  [pSelect, preySelect, protSelect].forEach(s => s.innerHTML = '');

  scn.characters.forEach(c => {
    pSelect.add(new Option(`[${c.abbr || c.name[0]}] ${c.name}`, c.id));
    preySelect.add(new Option(`[${c.abbr || c.name[0]}] ${c.name}`, c.id));
    protSelect.add(new Option(`[${c.abbr || c.name[0]}] ${c.name}`, c.id));
  });
}

function addCustomChar() {
  const name = document.getElementById('charNameInput').value.trim() || 'Char';
  const abbr = (document.getElementById('charAbbrInput').value.trim() || name[0]).toUpperCase();
  const type = document.getElementById('charTypeSelect').value;
  const emoji = document.getElementById('charEmojiInput').value.trim() || (type === 'human' ? '🧑' : type === 'animal' ? '🐾' : '📦');
  const id = 'c_' + Date.now();
  SCENARIOS.custom.characters.push({
    id, name, abbr, type, emoji, canRow: type === 'human'
  });
  document.getElementById('charNameInput').value = '';
  document.getElementById('charAbbrInput').value = '';
  document.getElementById('charEmojiInput').value = '';
  renderCustomBuilder();
}

function removeCustomChar(id) {
  SCENARIOS.custom.characters = SCENARIOS.custom.characters.filter(c => c.id !== id);
  renderCustomBuilder();
}

function addCustomRule() {
  const pred = document.getElementById('rulePredator').value;
  const prey = document.getElementById('rulePrey').value;
  const prot = document.getElementById('ruleProtector').value;
  if (!pred || !prey || pred === prey) {
    alert("Select two distinct characters for conflict!");
    return;
  }
  const predChar = SCENARIOS.custom.characters.find(c => c.id === pred);
  const preyChar = SCENARIOS.custom.characters.find(c => c.id === prey);
  const protChar = SCENARIOS.custom.characters.find(c => c.id === prot);

  if (!SCENARIOS.custom.conflicts) SCENARIOS.custom.conflicts = [];
  SCENARIOS.custom.conflicts.push({
    predatorId: pred,
    victimId: prey,
    protectorId: prot,
    message: `${predChar.name} (${predChar.abbr}) harmed ${preyChar.name} (${preyChar.abbr}) because ${protChar.name} (${protChar.abbr}) was missing!`
  });
  SCENARIOS.custom.rulesText.push(`${predChar.abbr} harms ${preyChar.abbr} without ${protChar.abbr}.`);
  renderRules();
  alert("Rule added!");
}

function applyCustomScenario() {
  SCENARIOS.custom.capacity = parseInt(document.getElementById('customCapInput').value) || 2;
  initGame('custom');
}

// --- BOOTSTRAP ---
async function bootApp() {
  document.getElementById('btnRow').addEventListener('click', rowBoat);
  document.getElementById('btnUndo').addEventListener('click', undoMove);
  document.getElementById('btnReset').addEventListener('click', resetCurrentGame);
  document.getElementById('btnGear').addEventListener('click', () => toggleSettings(true));

  setupDragTargets();
  await loadScenarios();
  initGame('mwgc');
}

window.addEventListener('DOMContentLoaded', bootApp);
