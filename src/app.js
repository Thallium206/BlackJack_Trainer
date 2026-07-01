import {
  BlackjackGame,
  COUNT_SYSTEMS,
  RANKS,
  formatAmount
} from "./game.js";

const game = new BlackjackGame();

const elements = {
  app: document.querySelector("#app"),
  bankrollMetric: document.querySelector("#bankrollMetric"),
  betMetric: document.querySelector("#betMetric"),
  netMetric: document.querySelector("#netMetric"),
  roundMetric: document.querySelector("#roundMetric"),
  phasePill: document.querySelector("#phasePill"),
  dealerScore: document.querySelector("#dealerScore"),
  dealerCards: document.querySelector("#dealerCards"),
  playerSummary: document.querySelector("#playerSummary"),
  playerHands: document.querySelector("#playerHands"),
  betInput: document.querySelector("#betInput"),
  dealButton: document.querySelector("#dealButton"),
  repeatBetButton: document.querySelector("#repeatBetButton"),
  clearBetButton: document.querySelector("#clearBetButton"),
  hitButton: document.querySelector("#hitButton"),
  standButton: document.querySelector("#standButton"),
  doubleButton: document.querySelector("#doubleButton"),
  splitButton: document.querySelector("#splitButton"),
  surrenderButton: document.querySelector("#surrenderButton"),
  insuranceRow: document.querySelector("#insuranceRow"),
  insuranceButton: document.querySelector("#insuranceButton"),
  skipInsuranceButton: document.querySelector("#skipInsuranceButton"),
  revealCountButton: document.querySelector("#revealCountButton"),
  countSystemBadge: document.querySelector("#countSystemBadge"),
  runningCount: document.querySelector("#runningCount"),
  trueCount: document.querySelector("#trueCount"),
  decksRemaining: document.querySelector("#decksRemaining"),
  penetrationMetric: document.querySelector("#penetrationMetric"),
  highDensity: document.querySelector("#highDensity"),
  lowDensity: document.querySelector("#lowDensity"),
  hiddenRemoved: document.querySelector("#hiddenRemoved"),
  countAgreement: document.querySelector("#countAgreement"),
  rankBars: document.querySelector("#rankBars"),
  deckCountSelect: document.querySelector("#deckCountSelect"),
  countSystemSelect: document.querySelector("#countSystemSelect"),
  penetrationInput: document.querySelector("#penetrationInput"),
  tableMaxInput: document.querySelector("#tableMaxInput"),
  soft17Toggle: document.querySelector("#soft17Toggle"),
  dasToggle: document.querySelector("#dasToggle"),
  surrenderToggle: document.querySelector("#surrenderToggle"),
  newShoeButton: document.querySelector("#newShoeButton"),
  resetSessionButton: document.querySelector("#resetSessionButton"),
  messageLog: document.querySelector("#messageLog")
};

const suitSymbols = {
  S: "\u2660",
  H: "\u2665",
  D: "\u2666",
  C: "\u2663"
};

const phaseLabels = {
  betting: "Mise",
  dealing: "Distribution",
  insurance: "Assurance",
  player: "Joueur",
  dealer: "Dealer",
  roundOver: "Resolue"
};

function money(amount) {
  return `${formatAmount(amount)} credits`;
}

function percent(value, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

function signed(value, digits = 1) {
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function cardNode(card) {
  const node = createElement("div", "playing-card");
  if (card.hidden) {
    node.classList.add("back");
    node.setAttribute("aria-label", "Carte cachee");
    return node;
  }

  if (card.suit === "H" || card.suit === "D") {
    node.classList.add("red");
  }

  const rank = createElement("span", "rank", card.rank);
  const suit = createElement("span", "suit", suitSymbols[card.suit] || card.suit);
  const corner = createElement("span", "corner", card.rank);
  node.append(rank, suit, corner);
  node.setAttribute("aria-label", `${card.rank} ${card.suit}`);
  return node;
}

function renderCards(container, cards) {
  container.replaceChildren();
  if (!cards.length) {
    container.append(createElement("div", "empty-state", "En attente"));
    return;
  }
  for (const card of cards) {
    container.append(cardNode(card));
  }
}

function renderHands(state) {
  elements.playerHands.replaceChildren();
  if (!state.hands.length) {
    elements.playerHands.append(createElement("div", "empty-state", "Place ta mise pour lancer la donne"));
    elements.playerSummary.textContent = "Place ta mise";
    return;
  }

  const summaries = [];
  for (const [index, hand] of state.hands.entries()) {
    const handNode = createElement("article", hand.active ? "hand active" : "hand");
    const header = createElement("div", "hand-header");
    const title = createElement("div", "hand-title", `Main ${index + 1}`);
    const status = hand.result ? ` · ${hand.result}` : hand.doubled ? " · Double" : "";
    const scoreLabel = hand.score.soft && hand.score.total <= 21 ? `${hand.score.total} soft` : `${hand.score.total}`;
    const meta = createElement("div", "hand-meta", `${scoreLabel} · ${money(hand.bet)}${status}`);
    header.append(title, meta);

    const row = createElement("div", "card-row");
    for (const card of hand.cards) {
      row.append(cardNode(card));
    }
    handNode.append(header, row);
    elements.playerHands.append(handNode);
    summaries.push(`${scoreLabel}${hand.result ? ` ${hand.result}` : ""}`);
  }

  elements.playerSummary.textContent = summaries.join(" / ");
}

function renderRankBars(training, decks) {
  elements.rankBars.replaceChildren();
  const maxPerRank = decks * 4;
  for (const rank of RANKS) {
    const count = training.remaining.byRank[rank] || 0;
    const node = createElement("div", "rank-bar");
    const track = createElement("div", "bar-track");
    const fill = createElement("div", "bar-fill");
    fill.style.height = `${Math.max(4, Math.round((count / maxPerRank) * 100))}%`;
    if (["10", "J", "Q", "K", "A"].includes(rank)) {
      fill.style.background = "var(--gold)";
    } else if (["2", "3", "4", "5", "6"].includes(rank)) {
      fill.style.background = "var(--green)";
    }
    track.append(fill);
    node.append(track, createElement("span", "rank-label", rank), createElement("span", "rank-count", String(count)));
    elements.rankBars.append(node);
  }
}

function renderTraining(state) {
  const training = state.training;
  elements.countSystemBadge.textContent = training.system.label;
  elements.runningCount.textContent = signed(training.runningCount, 0);
  elements.trueCount.textContent = signed(training.trueCount, 1);
  elements.decksRemaining.textContent = training.decksRemaining.toFixed(1);
  elements.penetrationMetric.textContent = percent(training.penetration);
  elements.highDensity.textContent = percent(training.highDensity, 1);
  elements.lowDensity.textContent = percent(training.lowDensity, 1);
  elements.hiddenRemoved.textContent = String(training.unseenRemovedCards);
  elements.countAgreement.textContent = training.estimateAgreement;
  renderRankBars(training, state.settings.decks);
}

function renderMessages(messages) {
  elements.messageLog.replaceChildren();
  if (!messages.length) {
    elements.messageLog.append(createElement("span", "log-item", "Pret."));
    return;
  }

  for (const message of messages.slice(0, 4)) {
    elements.messageLog.append(createElement("span", "log-item", message));
  }
}

function renderControls(state) {
  const canBet = ["betting", "roundOver"].includes(state.phase);
  const bankrollCanPlay = state.bankroll >= state.settings.minimumBet;
  elements.betInput.disabled = !canBet;
  elements.dealButton.disabled = !canBet || !bankrollCanPlay;
  elements.dealButton.textContent = state.phase === "roundOver" ? "Rejouer" : "Distribuer";
  elements.repeatBetButton.disabled = !canBet;
  elements.clearBetButton.disabled = !canBet;

  elements.hitButton.disabled = !state.actions.hit;
  elements.standButton.disabled = !state.actions.stand;
  elements.doubleButton.disabled = !state.actions.double;
  elements.splitButton.disabled = !state.actions.split;
  elements.surrenderButton.disabled = !state.actions.surrender;

  elements.insuranceRow.hidden = state.phase !== "insurance";
  elements.insuranceButton.disabled = state.bankroll < state.hands[0]?.bet / 2;
  elements.skipInsuranceButton.disabled = state.phase !== "insurance";
}

function syncSettingsControls(state) {
  if (document.activeElement === elements.betInput || document.activeElement === elements.penetrationInput || document.activeElement === elements.tableMaxInput) {
    return;
  }
  elements.betInput.min = state.settings.minimumBet;
  elements.betInput.max = state.settings.tableMaximum;
  elements.deckCountSelect.value = String(state.settings.decks);
  elements.countSystemSelect.value = state.settings.countingSystem;
  elements.penetrationInput.value = String(Math.round(state.settings.penetration * 100));
  elements.tableMaxInput.value = String(state.settings.tableMaximum);
  elements.soft17Toggle.checked = state.settings.dealerHitsSoft17;
  elements.dasToggle.checked = state.settings.doubleAfterSplit;
  elements.surrenderToggle.checked = state.settings.lateSurrender;
}

function render() {
  const state = game.getPublicState();
  elements.bankrollMetric.textContent = money(state.bankroll);
  elements.betMetric.textContent = money(Number(elements.betInput.value || state.lastBet));
  elements.netMetric.textContent = signed(state.stats.net, 0);
  elements.roundMetric.textContent = String(state.round);
  elements.phasePill.textContent = phaseLabels[state.phase] || state.phase;
  elements.dealerScore.textContent = state.dealerScore;

  renderCards(elements.dealerCards, state.dealer);
  renderHands(state);
  renderTraining(state);
  renderMessages(state.messages);
  renderControls(state);
  syncSettingsControls(state);
}

function currentBet() {
  return Number(elements.betInput.value || 0);
}

function clampBet(amount) {
  const min = game.settings.minimumBet;
  const max = Math.min(game.settings.tableMaximum, game.bankroll || game.settings.tableMaximum);
  return Math.max(0, Math.min(max, Math.round(amount / min) * min));
}

function placeChip(amount) {
  elements.betInput.value = String(clampBet(currentBet() + amount));
  render();
}

function applySettings() {
  game.updateSettings({
    decks: Number(elements.deckCountSelect.value),
    countingSystem: elements.countSystemSelect.value,
    penetration: Number(elements.penetrationInput.value) / 100,
    tableMaximum: Number(elements.tableMaxInput.value),
    dealerHitsSoft17: elements.soft17Toggle.checked,
    doubleAfterSplit: elements.dasToggle.checked,
    lateSurrender: elements.surrenderToggle.checked
  });
  render();
}

function setCountReveal(active) {
  elements.app.classList.toggle("count-revealed", active);
  elements.revealCountButton.setAttribute("aria-pressed", String(active));
}

function populateCountSystems() {
  for (const system of Object.values(COUNT_SYSTEMS)) {
    const option = document.createElement("option");
    option.value = system.id;
    option.textContent = system.label;
    option.title = system.description;
    elements.countSystemSelect.append(option);
  }
}

function bindEvents() {
  elements.dealButton.addEventListener("click", () => {
    game.startRound(currentBet());
    render();
  });

  elements.repeatBetButton.addEventListener("click", () => {
    elements.betInput.value = String(clampBet(game.lastBet));
    render();
  });

  elements.clearBetButton.addEventListener("click", () => {
    elements.betInput.value = "0";
    render();
  });

  document.querySelectorAll("[data-chip]").forEach((button) => {
    button.addEventListener("click", () => placeChip(Number(button.dataset.chip)));
  });

  elements.hitButton.addEventListener("click", () => {
    game.hit();
    render();
  });
  elements.standButton.addEventListener("click", () => {
    game.stand();
    render();
  });
  elements.doubleButton.addEventListener("click", () => {
    game.doubleDown();
    render();
  });
  elements.splitButton.addEventListener("click", () => {
    game.split();
    render();
  });
  elements.surrenderButton.addEventListener("click", () => {
    game.surrender();
    render();
  });
  elements.insuranceButton.addEventListener("click", () => {
    game.takeInsurance();
    render();
  });
  elements.skipInsuranceButton.addEventListener("click", () => {
    game.skipInsurance();
    render();
  });

  for (const input of [
    elements.deckCountSelect,
    elements.countSystemSelect,
    elements.penetrationInput,
    elements.tableMaxInput,
    elements.soft17Toggle,
    elements.dasToggle,
    elements.surrenderToggle
  ]) {
    input.addEventListener("change", applySettings);
  }

  elements.newShoeButton.addEventListener("click", () => {
    game.newShoe();
    render();
  });

  elements.resetSessionButton.addEventListener("click", () => {
    game.resetSession();
    elements.betInput.value = String(game.settings.minimumBet * 5);
    render();
  });

  elements.revealCountButton.addEventListener("pointerdown", (event) => {
    elements.revealCountButton.setPointerCapture?.(event.pointerId);
    setCountReveal(true);
  });
  elements.revealCountButton.addEventListener("pointerup", () => setCountReveal(false));
  elements.revealCountButton.addEventListener("pointercancel", () => setCountReveal(false));
  elements.revealCountButton.addEventListener("pointerleave", () => setCountReveal(false));
  elements.revealCountButton.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      setCountReveal(true);
    }
  });
  elements.revealCountButton.addEventListener("keyup", () => setCountReveal(false));
  window.addEventListener("blur", () => setCountReveal(false));

  elements.betInput.addEventListener("input", render);
}

populateCountSystems();
bindEvents();
render();
