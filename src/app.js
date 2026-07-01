import {
  BlackjackGame,
  COUNT_SYSTEMS,
  RANKS,
  formatAmount
} from "./game.js";
import {
  mostLikelyNextCard,
  recommendNextAction
} from "./advice.js";

const game = new BlackjackGame();

const elements = {
  app: document.querySelector("#app"),
  bankrollMetric: document.querySelector("#bankrollMetric"),
  betMetric: document.querySelector("#betMetric"),
  netMetric: document.querySelector("#netMetric"),
  roundMetric: document.querySelector("#roundMetric"),
  phasePill: document.querySelector("#phasePill"),
  roundBurst: document.querySelector("#roundBurst"),
  tableResult: document.querySelector("#tableResult"),
  tableResultKicker: document.querySelector("#tableResultKicker"),
  tableResultText: document.querySelector("#tableResultText"),
  tableResultDetail: document.querySelector("#tableResultDetail"),
  dealerScore: document.querySelector("#dealerScore"),
  dealerCards: document.querySelector("#dealerCards"),
  shoeStack: document.querySelector("#shoeStack"),
  shoeCardsRemaining: document.querySelector("#shoeCardsRemaining"),
  shoeCardsTotal: document.querySelector("#shoeCardsTotal"),
  shoeRemainingFill: document.querySelector("#shoeRemainingFill"),
  shoeDealtFill: document.querySelector("#shoeDealtFill"),
  shoeCutCard: document.querySelector("#shoeCutCard"),
  shoePenetrationLabel: document.querySelector("#shoePenetrationLabel"),
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
  countSystemBadge: document.querySelector("#countSystemBadge"),
  toggleCountPanelButton: document.querySelector("#toggleCountPanelButton"),
  countPanelBody: document.querySelector("#countPanelBody"),
  likelyCardValue: document.querySelector("#likelyCardValue"),
  likelyCardChance: document.querySelector("#likelyCardChance"),
  likelyCardDetail: document.querySelector("#likelyCardDetail"),
  recommendedAction: document.querySelector("#recommendedAction"),
  recommendationMode: document.querySelector("#recommendationMode"),
  recommendationReason: document.querySelector("#recommendationReason"),
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
  soundToggle: document.querySelector("#soundToggle"),
  newShoeButton: document.querySelector("#newShoeButton"),
  resetSessionButton: document.querySelector("#resetSessionButton"),
  messageLog: document.querySelector("#messageLog"),
  learnTabs: [...document.querySelectorAll(".learn-tab")],
  learnPanels: [...document.querySelectorAll(".learn-tab-panel")]
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

const cardVisibility = new Map();
const SHOE_SLICE_COUNT = 18;
let previousState = null;
let burstTimer = 0;
let audioContext = null;
let tooltipLayer = null;
let activeTooltipTarget = null;
let shoeTickTimer = 0;
let isCountPanelVisible = true;

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

function ensureTooltipLayer() {
  if (!tooltipLayer) {
    tooltipLayer = createElement("div", "tooltip-layer");
    tooltipLayer.setAttribute("role", "tooltip");
    document.body.append(tooltipLayer);
  }
  return tooltipLayer;
}

function targetWithTooltip(eventTarget) {
  return eventTarget instanceof Element ? eventTarget.closest("[data-tooltip]") : null;
}

function positionTooltip(target) {
  const layer = ensureTooltipLayer();
  const targetRect = target.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();
  const gap = 10;
  const left = Math.min(
    window.innerWidth - layerRect.width - 8,
    Math.max(8, targetRect.left + targetRect.width / 2 - layerRect.width / 2)
  );
  const topAbove = targetRect.top - layerRect.height - gap;
  const top = topAbove > 8 ? topAbove : targetRect.bottom + gap;

  layer.style.left = `${left}px`;
  layer.style.top = `${Math.min(window.innerHeight - layerRect.height - 8, Math.max(8, top))}px`;
}

function showTooltip(target) {
  const text = target.dataset.tooltip;
  if (!text) {
    return;
  }
  const layer = ensureTooltipLayer();
  activeTooltipTarget = target;
  layer.textContent = text;
  layer.classList.add("show");
  positionTooltip(target);
}

function hideTooltip() {
  activeTooltipTarget = null;
  tooltipLayer?.classList.remove("show");
}

function bindTooltips() {
  document.addEventListener("pointerover", (event) => {
    const target = targetWithTooltip(event.target);
    if (target) {
      showTooltip(target);
    }
  });

  document.addEventListener("pointerout", (event) => {
    const related = event.relatedTarget;
    if (activeTooltipTarget && related instanceof Node && activeTooltipTarget.contains(related)) {
      return;
    }
    hideTooltip();
  });

  document.addEventListener("focusin", (event) => {
    const target = targetWithTooltip(event.target);
    if (target) {
      showTooltip(target);
    }
  });

  document.addEventListener("focusout", hideTooltip);
  window.addEventListener("scroll", hideTooltip, true);
  window.addEventListener("resize", hideTooltip);
}

function animationClassForCard(card) {
  const wasHidden = cardVisibility.get(card.id);
  if (wasHidden === undefined) {
    return "fresh-card";
  }
  if (wasHidden && !card.hidden) {
    return "flip-card";
  }
  return "";
}

function rememberCardVisibility(state) {
  cardVisibility.clear();
  for (const card of state.dealer) {
    cardVisibility.set(card.id, Boolean(card.hidden));
  }
  for (const hand of state.hands) {
    for (const card of hand.cards) {
      cardVisibility.set(card.id, false);
    }
  }
}

function cardNode(card, animationIndex = 0) {
  const node = createElement("div", "playing-card");
  const animationClass = animationClassForCard(card);
  if (animationClass) {
    node.classList.add(animationClass);
    node.style.setProperty("--deal-index", String(animationIndex));
  }

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
  for (const [index, card] of cards.entries()) {
    container.append(cardNode(card, index));
  }
}

function outcomeClass(hand) {
  if (!hand.result) {
    return "";
  }
  if (hand.result.includes("Push")) {
    return "hand-push";
  }
  if (["Blackjack", "Gagne", "Dealer bust", "21 gagne"].includes(hand.result)) {
    return "hand-win";
  }
  return "hand-loss";
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
    const handClasses = ["hand", outcomeClass(hand)];
    if (hand.active) {
      handClasses.push("active");
    }
    const handNode = createElement("article", handClasses.filter(Boolean).join(" "));
    const header = createElement("div", "hand-header");
    const title = createElement("div", "hand-title", `Main ${index + 1}`);
    const status = hand.result ? ` · ${hand.result}` : hand.doubled ? " · Double" : "";
    const scoreLabel = hand.scoreLabel || `${hand.score.total}`;
    const meta = createElement("div", "hand-meta", `${scoreLabel} · ${money(hand.bet)}${status}`);
    header.append(title, meta);

    const row = createElement("div", "card-row");
    for (const [cardIndex, card] of hand.cards.entries()) {
      row.append(cardNode(card, cardIndex));
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
  for (const [index, rank] of RANKS.entries()) {
    const count = training.remaining.byRank[rank] || 0;
    const node = createElement("div", "rank-bar tip-target");
    node.style.setProperty("--bar-index", String(index));
    node.tabIndex = 0;
    node.dataset.tooltip = `Il reste ${count} carte${count > 1 ? "s" : ""} de rang ${rank} dans le sabot sur ${maxPerRank} possibles.`;
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
  const likelyCard = mostLikelyNextCard(training);
  const advice = recommendNextAction(state);

  elements.countSystemBadge.textContent = training.system.label;
  elements.likelyCardValue.textContent = likelyCard.label;
  elements.likelyCardChance.textContent = percent(likelyCard.probability, 1);
  elements.likelyCardDetail.textContent = likelyCard.remaining
    ? `${likelyCard.count}/${likelyCard.remaining} cartes restantes (${likelyCard.detail}).`
    : "Le sabot est vide.";
  elements.recommendedAction.textContent = advice.actionLabel;
  elements.recommendationMode.textContent = advice.mode;
  elements.recommendationReason.textContent = advice.reason;
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

function renderShoeState(state, previous) {
  const totalCards = state.settings.decks * 52;
  const remaining = state.training.cardsRemaining;
  const remainingRatio = totalCards ? remaining / totalCards : 0;
  const penetration = totalCards ? 1 - remainingRatio : 0;
  const cutPosition = Math.min(0.98, Math.max(0.02, state.settings.penetration));
  const visibleSlices = Math.max(1, Math.ceil(remainingRatio * SHOE_SLICE_COUNT));

  elements.shoeCardsRemaining.textContent = String(remaining);
  elements.shoeCardsTotal.textContent = String(totalCards);
  elements.shoePenetrationLabel.textContent = `${percent(penetration)} joue`;
  elements.shoeRemainingFill.style.width = `${Math.max(0, remainingRatio * 100)}%`;
  elements.shoeDealtFill.style.width = `${Math.min(100, penetration * 100)}%`;
  elements.shoeCutCard.style.left = `${cutPosition * 100}%`;

  elements.shoeStack.replaceChildren();
  for (let index = 0; index < SHOE_SLICE_COUNT; index += 1) {
    const slice = createElement("span", "shoe-card-slice");
    const reverseIndex = SHOE_SLICE_COUNT - index - 1;
    slice.style.setProperty("--slice-index", String(index));
    slice.style.setProperty("--slice-lift", `${reverseIndex * 1.35}px`);
    if (index >= visibleSlices) {
      slice.classList.add("depleted");
    }
    elements.shoeStack.append(slice);
  }

  const station = elements.shoeStack.closest(".shoe-station");
  station.classList.toggle("near-cut", penetration >= state.settings.penetration * 0.85);
  station.classList.toggle("shuffle-soon", penetration >= state.settings.penetration * 0.97);
  if (previous && previous.training.cardsRemaining !== remaining) {
    station.classList.remove("shoe-tick");
    void station.offsetWidth;
    station.classList.add("shoe-tick");
    clearTimeout(shoeTickTimer);
    shoeTickTimer = window.setTimeout(() => station.classList.remove("shoe-tick"), 520);
  }
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

function soundEnabled() {
  return Boolean(elements.soundToggle?.checked);
}

function primeAudio() {
  if (!soundEnabled() || audioContext) {
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  audioContext = new AudioContextClass();
}

function playTone(frequency, duration = 0.08, delay = 0, type = "triangle", volume = 0.035) {
  if (!soundEnabled() || !audioContext) {
    return;
  }

  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playSound(kind) {
  if (!soundEnabled()) {
    return;
  }
  primeAudio();
  audioContext?.resume?.();

  if (kind === "chip") {
    playTone(520, 0.055, 0, "square", 0.018);
    playTone(740, 0.045, 0.045, "square", 0.014);
  } else if (kind === "deal") {
    playTone(260, 0.045, 0, "triangle", 0.026);
    playTone(390, 0.04, 0.04, "triangle", 0.018);
  } else if (kind === "win") {
    playTone(523, 0.08, 0, "triangle", 0.03);
    playTone(659, 0.08, 0.07, "triangle", 0.03);
    playTone(784, 0.11, 0.14, "triangle", 0.032);
  } else if (kind === "loss") {
    playTone(220, 0.11, 0, "sawtooth", 0.024);
    playTone(165, 0.14, 0.08, "sawtooth", 0.02);
  } else if (kind === "push") {
    playTone(440, 0.06, 0, "sine", 0.02);
    playTone(440, 0.06, 0.08, "sine", 0.018);
  } else if (kind === "count") {
    playTone(880, 0.05, 0, "sine", 0.018);
  } else {
    playTone(360, 0.045, 0, "triangle", 0.018);
  }
}

function pulseValue(element, delta) {
  if (!element || delta === 0) {
    return;
  }
  element.classList.remove("value-pop", "positive", "negative");
  void element.offsetWidth;
  element.classList.add("value-pop", delta > 0 ? "positive" : "negative");
  window.setTimeout(() => {
    element.classList.remove("value-pop", "positive", "negative");
  }, 520);
}

function computeRoundNet(state) {
  return state.hands.reduce((total, hand) => total + (hand.payout - hand.bet), 0);
}

function roundOutcome(state) {
  const roundNet = computeRoundNet(state);
  const hasBlackjack = state.hands.some((hand) => hand.result === "Blackjack");
  const hasAutoTwentyOne = state.hands.some((hand) => hand.result.startsWith("21"));
  const playerWins = state.hands.filter((hand) => ["Blackjack", "Gagne", "Dealer bust", "21 gagne"].includes(hand.result)).length;
  const dealerWins = state.hands.filter((hand) => ["Bust", "Perdu", "Dealer blackjack", "Abandon"].includes(hand.result)).length;
  const pushes = state.hands.filter((hand) => hand.result.includes("Push") || hand.result === "21 push").length;
  const resultClass = roundNet > 0 ? "win" : roundNet < 0 ? "loss" : "push";
  const amountLabel = roundNet === 0 ? "0" : `${roundNet > 0 ? "+" : ""}${formatAmount(roundNet)}`;

  let title = "Egalite";
  let kicker = "Push";
  if (roundNet > 0) {
    title = hasBlackjack ? "Blackjack joueur" : hasAutoTwentyOne ? "21 joueur" : "Joueur gagne";
    kicker = "Victoire";
  } else if (roundNet < 0) {
    title = "Dealer gagne";
    kicker = "Defaite";
  } else if (hasAutoTwentyOne) {
    title = "21 push";
  }

  const details = [];
  if (playerWins) {
    details.push(`${playerWins} main${playerWins > 1 ? "s" : ""} gagnee${playerWins > 1 ? "s" : ""}`);
  }
  if (dealerWins) {
    details.push(`${dealerWins} main${dealerWins > 1 ? "s" : ""} perdue${dealerWins > 1 ? "s" : ""}`);
  }
  if (pushes) {
    details.push(`${pushes} push`);
  }
  if (hasAutoTwentyOne && !hasBlackjack) {
    details.push("21 atteint automatiquement");
  }

  return {
    amountLabel,
    detail: details.length ? details.join(" / ") : "Mise rendue.",
    kicker,
    resultClass,
    title
  };
}

function showRoundBurst(state, previous) {
  if (!previous || state.phase !== "roundOver" || previous.phase === "roundOver") {
    return;
  }

  const outcome = roundOutcome(state);
  const label = `${outcome.title} ${outcome.amountLabel === "0" ? "" : outcome.amountLabel}`.trim();

  elements.roundBurst.textContent = label;
  elements.roundBurst.className = `round-burst show ${outcome.resultClass}`;
  elements.app.classList.remove("result-win", "result-loss", "result-push");
  elements.app.classList.add(`result-${outcome.resultClass}`);
  clearTimeout(burstTimer);
  burstTimer = window.setTimeout(() => {
    elements.roundBurst.className = "round-burst";
    elements.app.classList.remove("result-win", "result-loss", "result-push");
  }, 1800);

  playSound(outcome.resultClass);
}

function applyRenderEffects(state, previous) {
  if (!previous) {
    return;
  }

  pulseValue(elements.bankrollMetric, state.bankroll - previous.bankroll);
  pulseValue(elements.netMetric, state.stats.net - previous.stats.net);
  showRoundBurst(state, previous);
}

function renderTableResult(state) {
  elements.tableResult.classList.remove("show", "win", "loss", "push", "playing");

  if (state.phase === "roundOver" && state.hands.length) {
    const outcome = roundOutcome(state);
    elements.tableResultKicker.textContent = outcome.kicker;
    elements.tableResultText.textContent = outcome.title;
    elements.tableResultDetail.textContent = `${outcome.amountLabel === "0" ? "Mise rendue" : outcome.amountLabel} / ${outcome.detail}`;
    elements.tableResult.classList.add("show", outcome.resultClass);
    return;
  }

  if (state.phase === "player") {
    elements.tableResultKicker.textContent = "Decision";
    elements.tableResultText.textContent = `Main ${state.activeHandIndex + 1}`;
    elements.tableResultDetail.textContent = "Choisis tirer, rester, doubler, split ou abandon si disponible.";
    elements.tableResult.classList.add("show", "playing");
    return;
  }

  if (state.phase === "dealer") {
    elements.tableResultKicker.textContent = "Dealer";
    elements.tableResultText.textContent = "Le dealer joue";
    elements.tableResultDetail.textContent = "Le resultat arrive apres la main du dealer.";
    elements.tableResult.classList.add("show", "playing");
    return;
  }

  if (state.phase === "insurance") {
    elements.tableResultKicker.textContent = "Assurance";
    elements.tableResultText.textContent = "Dealer montre un As";
    elements.tableResultDetail.textContent = "Prends ou passe l'assurance avant de continuer.";
    elements.tableResult.classList.add("show", "playing");
    return;
  }

  elements.tableResultKicker.textContent = "Pret";
  elements.tableResultText.textContent = "Place ta mise";
  elements.tableResultDetail.textContent = "Le resultat de la manche apparaitra ici.";
}

function setButtonDisabled(button, disabled) {
  button.dataset.disabled = disabled ? "true" : "false";
  button.setAttribute("aria-disabled", String(disabled));
  button.classList.toggle("is-disabled", disabled);
}

function isButtonDisabled(button) {
  return button?.dataset.disabled === "true";
}

function renderControls(state) {
  const canBet = ["betting", "roundOver"].includes(state.phase);
  const bankrollCanPlay = state.bankroll >= state.settings.minimumBet;
  elements.betInput.disabled = !canBet;
  setButtonDisabled(elements.dealButton, !canBet || !bankrollCanPlay);
  elements.dealButton.textContent = state.phase === "roundOver" ? "Rejouer" : "Distribuer";
  setButtonDisabled(elements.repeatBetButton, !canBet);
  setButtonDisabled(elements.clearBetButton, !canBet);

  setButtonDisabled(elements.hitButton, !state.actions.hit);
  setButtonDisabled(elements.standButton, !state.actions.stand);
  setButtonDisabled(elements.doubleButton, !state.actions.double);
  setButtonDisabled(elements.splitButton, !state.actions.split);
  setButtonDisabled(elements.surrenderButton, !state.actions.surrender);

  elements.insuranceRow.hidden = state.phase !== "insurance";
  setButtonDisabled(elements.insuranceButton, state.phase !== "insurance" || state.bankroll < state.hands[0]?.bet / 2);
  setButtonDisabled(elements.skipInsuranceButton, state.phase !== "insurance");
}

function renderCountPanelVisibility() {
  elements.countPanelBody.hidden = !isCountPanelVisible;
  elements.toggleCountPanelButton.textContent = isCountPanelVisible ? "Masquer" : "Afficher";
  elements.toggleCountPanelButton.setAttribute("aria-expanded", String(isCountPanelVisible));
}

function setLearnTab(tabName) {
  for (const tab of elements.learnTabs) {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  }

  for (const panel of elements.learnPanels) {
    const isActive = panel.id === `${tabName}Panel`;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  }
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
  renderTableResult(state);
  renderTraining(state);
  renderShoeState(state, previousState);
  renderMessages(state.messages);
  renderControls(state);
  renderCountPanelVisibility();
  syncSettingsControls(state);
  applyRenderEffects(state, previousState);
  previousState = state;
  rememberCardVisibility(state);
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

function populateCountSystems() {
  for (const system of Object.values(COUNT_SYSTEMS)) {
    const option = document.createElement("option");
    option.value = system.id;
    option.textContent = system.label;
    option.title = system.description;
    elements.countSystemSelect.append(option);
  }
}

function runGameAction(sound, action) {
  playSound(sound);
  action();
  render();
}

function bindEvents() {
  elements.dealButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    runGameAction("deal", () => game.startRound(currentBet()));
  });

  elements.repeatBetButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    playSound("tap");
    elements.betInput.value = String(clampBet(game.lastBet));
    render();
  });

  elements.clearBetButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    playSound("tap");
    elements.betInput.value = "0";
    render();
  });

  document.querySelectorAll("[data-chip]").forEach((button) => {
    button.addEventListener("click", () => {
      playSound("chip");
      placeChip(Number(button.dataset.chip));
    });
  });

  elements.hitButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    runGameAction("deal", () => game.hit());
  });
  elements.standButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    runGameAction("tap", () => game.stand());
  });
  elements.doubleButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    runGameAction("chip", () => game.doubleDown());
  });
  elements.splitButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    runGameAction("chip", () => game.split());
  });
  elements.surrenderButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    runGameAction("loss", () => game.surrender());
  });
  elements.insuranceButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    runGameAction("chip", () => game.takeInsurance());
  });
  elements.skipInsuranceButton.addEventListener("click", (event) => {
    if (isButtonDisabled(event.currentTarget)) {
      return;
    }
    runGameAction("tap", () => game.skipInsurance());
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
    input.addEventListener("change", () => {
      playSound("tap");
      applySettings();
    });
  }

  elements.soundToggle.addEventListener("change", () => {
    if (elements.soundToggle.checked) {
      playSound("tap");
    }
  });

  elements.toggleCountPanelButton.addEventListener("click", () => {
    playSound("tap");
    isCountPanelVisible = !isCountPanelVisible;
    renderCountPanelVisibility();
  });

  for (const tab of elements.learnTabs) {
    tab.addEventListener("click", () => {
      playSound("tap");
      setLearnTab(tab.dataset.tab);
    });
  }

  elements.newShoeButton.addEventListener("click", () => {
    runGameAction("deal", () => game.newShoe());
  });

  elements.resetSessionButton.addEventListener("click", () => {
    playSound("tap");
    game.resetSession();
    elements.betInput.value = String(game.settings.minimumBet * 5);
    render();
  });

  elements.betInput.addEventListener("input", render);
}

populateCountSystems();
bindTooltips();
bindEvents();
setLearnTab("rules");
render();
