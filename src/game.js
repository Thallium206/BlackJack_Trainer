export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const SUITS = ["S", "H", "D", "C"];

export const COUNT_SYSTEMS = {
  hiLo: {
    id: "hiLo",
    label: "Hi-Lo",
    balanced: true,
    description: "2-6 = +1, 7-9 = 0, 10-A = -1",
    values: {
      A: -1,
      2: 1,
      3: 1,
      4: 1,
      5: 1,
      6: 1,
      7: 0,
      8: 0,
      9: 0,
      10: -1,
      J: -1,
      Q: -1,
      K: -1
    }
  },
  ko: {
    id: "ko",
    label: "KO",
    balanced: false,
    description: "2-7 = +1, 8-9 = 0, 10-A = -1",
    values: {
      A: -1,
      2: 1,
      3: 1,
      4: 1,
      5: 1,
      6: 1,
      7: 1,
      8: 0,
      9: 0,
      10: -1,
      J: -1,
      Q: -1,
      K: -1
    }
  },
  hiOptI: {
    id: "hiOptI",
    label: "Hi-Opt I",
    balanced: true,
    description: "3-6 = +1, 10-K = -1, As = 0",
    values: {
      A: 0,
      2: 0,
      3: 1,
      4: 1,
      5: 1,
      6: 1,
      7: 0,
      8: 0,
      9: 0,
      10: -1,
      J: -1,
      Q: -1,
      K: -1
    }
  },
  omegaII: {
    id: "omegaII",
    label: "Omega II",
    balanced: true,
    description: "2/3/7 = +1, 4-6 = +2, 9 = -1, 10-K = -2",
    values: {
      A: 0,
      2: 1,
      3: 1,
      4: 2,
      5: 2,
      6: 2,
      7: 1,
      8: 0,
      9: -1,
      10: -2,
      J: -2,
      Q: -2,
      K: -2
    }
  },
  zen: {
    id: "zen",
    label: "Zen Count",
    balanced: true,
    description: "2/3/7 = +1, 4-6 = +2, 10-K = -2, A = -1",
    values: {
      A: -1,
      2: 1,
      3: 1,
      4: 2,
      5: 2,
      6: 2,
      7: 1,
      8: 0,
      9: 0,
      10: -2,
      J: -2,
      Q: -2,
      K: -2
    }
  }
};

export const DEFAULT_SETTINGS = {
  decks: 6,
  countingSystem: "hiLo",
  blackjackPayout: 1.5,
  dealerHitsSoft17: false,
  doubleAfterSplit: true,
  lateSurrender: true,
  maxHandsAfterSplit: 4,
  penetration: 0.75,
  startingBankroll: 1000,
  minimumBet: 5,
  tableMaximum: 500
};

const FACE_VALUE = new Map([
  ["A", 11],
  ["2", 2],
  ["3", 3],
  ["4", 4],
  ["5", 5],
  ["6", 6],
  ["7", 7],
  ["8", 8],
  ["9", 9],
  ["10", 10],
  ["J", 10],
  ["Q", 10],
  ["K", 10]
]);

export function createCard(rank, suit = "S") {
  return {
    id: `${rank}-${suit}-${cryptoSafeId()}`,
    rank,
    suit,
    seen: false
  };
}

function cryptoSafeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(16).slice(2, 10);
}

export function getCardValue(rank) {
  return FACE_VALUE.get(rank) || 0;
}

export function normalizeAmount(amount) {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

export function formatAmount(amount) {
  return normalizeAmount(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: Number.isInteger(normalizeAmount(amount)) ? 0 : 2,
    maximumFractionDigits: 2
  });
}

export function scoreHand(cards) {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    total += getCardValue(card.rank);
    if (card.rank === "A") {
      aces += 1;
    }
  }

  let soft = aces > 0;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  soft = aces > 0;

  return {
    total,
    soft,
    busted: total > 21,
    blackjack: cards.length === 2 && total === 21
  };
}

export function hardTotalFor(cards) {
  return cards.reduce((total, card) => {
    return total + (card.rank === "A" ? 1 : getCardValue(card.rank));
  }, 0);
}

export function scoreLabelFor(cards) {
  if (!cards.length) {
    return "0";
  }

  const score = scoreHand(cards);
  const hasAce = cards.some((card) => card.rank === "A");
  const hardTotal = hardTotalFor(cards);

  if (hasAce && score.soft && score.total <= 21 && hardTotal !== score.total) {
    return `${hardTotal} (${score.total} soft)`;
  }
  if (hasAce) {
    return `${score.total} hard`;
  }
  return `${score.total}`;
}

export function makeShoe(deckCount) {
  const cards = [];
  for (let deck = 0; deck < deckCount; deck += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push(createCard(rank, suit));
      }
    }
  }
  return cards;
}

export function shuffle(cards, random = Math.random) {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createHand(cards = [], bet = 0, source = "initial") {
  return {
    id: cryptoSafeId(),
    cards,
    bet,
    source,
    doubled: false,
    surrendered: false,
    settled: false,
    result: "",
    payout: 0,
    locked: false,
    splitAces: false
  };
}

function cloneSettings(settings) {
  return { ...DEFAULT_SETTINGS, ...settings };
}

function rankCount(cards) {
  return RANKS.reduce((accumulator, rank) => {
    accumulator[rank] = cards.filter((card) => card.rank === rank).length;
    return accumulator;
  }, {});
}

function compositionFor(cards) {
  const byRank = rankCount(cards);
  const high = ["10", "J", "Q", "K", "A"].reduce((sum, rank) => sum + byRank[rank], 0);
  const low = ["2", "3", "4", "5", "6"].reduce((sum, rank) => sum + byRank[rank], 0);
  const neutral = ["7", "8", "9"].reduce((sum, rank) => sum + byRank[rank], 0);

  return {
    byRank,
    high,
    low,
    neutral
  };
}

export class BlackjackGame {
  constructor(settings = {}, random = Math.random) {
    this.random = random;
    this.settings = cloneSettings(settings);
    this.bankroll = this.settings.startingBankroll;
    this.phase = "betting";
    this.round = 0;
    this.lastBet = this.settings.minimumBet;
    this.insuranceBet = 0;
    this.runningCount = 0;
    this.seenCards = [];
    this.hiddenCards = [];
    this.discard = [];
    this.messages = [];
    this.stats = {
      handsPlayed: 0,
      roundsPlayed: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      blackjacks: 0,
      surrendered: 0,
      net: 0
    };
    this.newShoe();
  }

  updateSettings(nextSettings = {}) {
    const oldDecks = this.settings.decks;
    const oldCount = this.settings.countingSystem;
    this.settings = cloneSettings({ ...this.settings, ...nextSettings });

    if (this.settings.decks !== oldDecks || this.settings.countingSystem !== oldCount) {
      this.newShoe("Parametres du sabot appliques.");
    }

    if (this.bankroll <= 0) {
      this.bankroll = this.settings.startingBankroll;
    }
  }

  resetSession() {
    this.bankroll = this.settings.startingBankroll;
    this.phase = "betting";
    this.round = 0;
    this.lastBet = this.settings.minimumBet;
    this.insuranceBet = 0;
    this.dealer = [];
    this.hands = [];
    this.activeHandIndex = 0;
    this.messages = [];
    this.stats = {
      handsPlayed: 0,
      roundsPlayed: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      blackjacks: 0,
      surrendered: 0,
      net: 0
    };
    this.newShoe("Session remise a zero.");
  }

  newShoe(message = "Nouveau sabot melange.") {
    this.shoe = shuffle(makeShoe(this.settings.decks), this.random);
    this.discard = [];
    this.seenCards = [];
    this.hiddenCards = [];
    this.runningCount = 0;
    this.dealer = [];
    this.hands = [];
    this.activeHandIndex = 0;
    this.phase = "betting";
    this.insuranceBet = 0;
    this.pushMessage(message);
  }

  pushMessage(message) {
    this.messages = [message, ...this.messages].slice(0, 8);
  }

  currentCountSystem() {
    return COUNT_SYSTEMS[this.settings.countingSystem] || COUNT_SYSTEMS.hiLo;
  }

  countValue(card) {
    return this.currentCountSystem().values[card.rank] || 0;
  }

  markSeen(card) {
    if (!card || card.seen) {
      return;
    }
    card.seen = true;
    this.runningCount += this.countValue(card);
    this.seenCards.push(card);
    this.hiddenCards = this.hiddenCards.filter((hidden) => hidden.id !== card.id);
  }

  dealCard({ visible = true } = {}) {
    if (this.shoe.length < 1) {
      this.shoe = shuffle(makeShoe(this.settings.decks), this.random);
      this.discard = [];
      this.seenCards = [];
      this.hiddenCards = [];
      this.runningCount = 0;
      this.pushMessage("Sabot vide: remelange automatique.");
    }

    const card = this.shoe.pop();
    if (visible) {
      this.markSeen(card);
    } else {
      this.hiddenCards.push(card);
    }
    return card;
  }

  revealDealerHole() {
    for (const card of this.dealer) {
      this.markSeen(card);
    }
  }

  shouldShuffleBeforeRound() {
    const totalCards = this.settings.decks * 52;
    const cardsDealt = totalCards - this.shoe.length;
    return cardsDealt / totalCards >= this.settings.penetration;
  }

  startRound(bet) {
    if (!["betting", "roundOver"].includes(this.phase)) {
      return;
    }

    const normalizedBet = normalizeAmount(bet);
    if (!Number.isFinite(normalizedBet) || normalizedBet <= 0) {
      this.pushMessage("Choisis une mise valide.");
      return;
    }
    if (normalizedBet < this.settings.minimumBet) {
      this.pushMessage(`Mise minimum: ${formatAmount(this.settings.minimumBet)}.`);
      return;
    }
    if (normalizedBet > this.settings.tableMaximum) {
      this.pushMessage(`Maximum table: ${formatAmount(this.settings.tableMaximum)}.`);
      return;
    }
    if (normalizedBet > this.bankroll) {
      this.pushMessage("Bankroll insuffisante pour cette mise.");
      return;
    }

    if (this.shouldShuffleBeforeRound()) {
      this.newShoe("Penetration atteinte: nouveau sabot.");
    }

    this.round += 1;
    this.insuranceBet = 0;
    this.bankroll = normalizeAmount(this.bankroll - normalizedBet);
    this.lastBet = normalizedBet;
    this.dealer = [];
    this.hands = [createHand([], normalizedBet)];
    this.activeHandIndex = 0;
    this.phase = "dealing";

    this.hands[0].cards.push(this.dealCard());
    this.dealer.push(this.dealCard());
    this.hands[0].cards.push(this.dealCard());
    this.dealer.push(this.dealCard({ visible: false }));

    const dealerUpcard = this.dealer[0];
    const dealerScore = scoreHand(this.dealer);
    const playerScore = scoreHand(this.hands[0].cards);

    if (dealerUpcard.rank === "A") {
      this.phase = "insurance";
      this.pushMessage("Assurance disponible.");
      return;
    }

    if (dealerScore.blackjack) {
      this.revealDealerHole();
      this.resolveDealerBlackjack();
      return;
    }

    if (playerScore.blackjack) {
      this.revealDealerHole();
      this.settleNaturalBlackjack(this.hands[0]);
      this.finishRound("Blackjack naturel.");
      return;
    }

    this.phase = "player";
    this.pushMessage("A toi de jouer.");
  }

  takeInsurance() {
    if (this.phase !== "insurance") {
      return;
    }
    const maxInsurance = normalizeAmount(this.hands[0].bet / 2);
    if (this.bankroll < maxInsurance) {
      this.pushMessage("Bankroll insuffisante pour assurer.");
      return;
    }
    this.bankroll = normalizeAmount(this.bankroll - maxInsurance);
    this.insuranceBet = maxInsurance;
    this.resolveInsurance();
  }

  skipInsurance() {
    if (this.phase === "insurance") {
      this.resolveInsurance();
    }
  }

  resolveInsurance() {
    const dealerHasBlackjack = scoreHand(this.dealer).blackjack;
    if (dealerHasBlackjack) {
      this.revealDealerHole();
      if (this.insuranceBet > 0) {
        this.bankroll = normalizeAmount(this.bankroll + this.insuranceBet * 3);
        this.stats.net = normalizeAmount(this.stats.net + this.insuranceBet * 2);
      }
      this.resolveDealerBlackjack();
      return;
    }

    const playerScore = scoreHand(this.hands[0].cards);
    if (this.insuranceBet > 0) {
      this.stats.net = normalizeAmount(this.stats.net - this.insuranceBet);
    }
    if (playerScore.blackjack) {
      this.revealDealerHole();
      this.settleNaturalBlackjack(this.hands[0]);
      this.finishRound("Blackjack naturel.");
      return;
    }

    this.phase = "player";
    this.pushMessage(this.insuranceBet > 0 ? "Assurance perdue, la main continue." : "Pas d'assurance, la main continue.");
  }

  resolveDealerBlackjack() {
    const player = this.hands[0];
    const playerScore = scoreHand(player.cards);
    if (playerScore.blackjack) {
      this.payPush(player, "Push blackjack");
      this.finishRound("Deux blackjacks: push.");
      return;
    }

    this.payLoss(player, "Dealer blackjack");
    this.finishRound("Dealer blackjack.");
  }

  settleNaturalBlackjack(hand) {
    const payout = normalizeAmount(hand.bet * (1 + this.settings.blackjackPayout));
    this.bankroll = normalizeAmount(this.bankroll + payout);
    hand.settled = true;
    hand.result = "Blackjack";
    hand.payout = payout;
    this.stats.blackjacks += 1;
    this.stats.wins += 1;
    this.stats.net = normalizeAmount(this.stats.net + hand.bet * this.settings.blackjackPayout);
  }

  activeHand() {
    return this.hands[this.activeHandIndex] || null;
  }

  availableActions() {
    const hand = this.activeHand();
    if (this.phase !== "player" || !hand || hand.locked) {
      return {
        hit: false,
        stand: false,
        double: false,
        split: false,
        surrender: false
      };
    }

    const canDouble = hand.cards.length === 2
      && this.bankroll >= hand.bet
      && (hand.source !== "split" || this.settings.doubleAfterSplit)
      && !hand.splitAces;
    const canSplit = hand.cards.length === 2
      && this.hands.length < this.settings.maxHandsAfterSplit
      && this.bankroll >= hand.bet
      && this.canSplitHand(hand);
    const canSurrender = this.settings.lateSurrender
      && hand.cards.length === 2
      && this.hands.length === 1
      && !hand.doubled;

    return {
      hit: !hand.splitAces,
      stand: true,
      double: canDouble,
      split: canSplit,
      surrender: canSurrender
    };
  }

  canSplitHand(hand) {
    if (hand.cards.length !== 2) {
      return false;
    }
    const [first, second] = hand.cards;
    return first.rank === second.rank || getCardValue(first.rank) === getCardValue(second.rank);
  }

  hit() {
    const hand = this.activeHand();
    if (!this.availableActions().hit) {
      return;
    }

    hand.cards.push(this.dealCard());
    const score = scoreHand(hand.cards);
    if (score.busted) {
      hand.locked = true;
      hand.result = "Bust";
      this.pushMessage(`Main ${this.activeHandIndex + 1}: bust.`);
      this.advanceHand();
    }
  }

  stand() {
    const hand = this.activeHand();
    if (!this.availableActions().stand) {
      return;
    }
    hand.locked = true;
    this.advanceHand();
  }

  doubleDown() {
    const hand = this.activeHand();
    if (!this.availableActions().double) {
      return;
    }

    this.bankroll = normalizeAmount(this.bankroll - hand.bet);
    hand.bet = normalizeAmount(hand.bet * 2);
    hand.doubled = true;
    hand.cards.push(this.dealCard());
    hand.locked = true;
    this.pushMessage(`Main ${this.activeHandIndex + 1}: double.`);
    this.advanceHand();
  }

  split() {
    const hand = this.activeHand();
    if (!this.availableActions().split) {
      return;
    }

    this.bankroll = normalizeAmount(this.bankroll - hand.bet);
    const [firstCard, secondCard] = hand.cards;
    const firstHand = createHand([firstCard], hand.bet, "split");
    const secondHand = createHand([secondCard], hand.bet, "split");
    firstHand.splitAces = firstCard.rank === "A";
    secondHand.splitAces = secondCard.rank === "A";

    firstHand.cards.push(this.dealCard());
    secondHand.cards.push(this.dealCard());

    if (firstHand.splitAces) {
      firstHand.locked = true;
      secondHand.locked = true;
    }

    this.hands.splice(this.activeHandIndex, 1, firstHand, secondHand);
    this.pushMessage(firstHand.splitAces ? "Split des As: une carte par main." : "Main splittee.");

    if (firstHand.locked) {
      this.advanceHand();
    }
  }

  surrender() {
    const hand = this.activeHand();
    if (!this.availableActions().surrender) {
      return;
    }

    this.revealDealerHole();
    hand.surrendered = true;
    hand.locked = true;
    const refund = normalizeAmount(hand.bet / 2);
    this.bankroll = normalizeAmount(this.bankroll + refund);
    hand.settled = true;
    hand.result = "Abandon";
    hand.payout = refund;
    this.stats.surrendered += 1;
    this.stats.losses += 1;
    this.stats.net = normalizeAmount(this.stats.net - refund);
    this.finishRound("Abandon tardif: demi-mise rendue.");
  }

  advanceHand() {
    const nextIndex = this.hands.findIndex((hand, index) => index > this.activeHandIndex && !hand.locked);
    if (nextIndex >= 0) {
      this.activeHandIndex = nextIndex;
      this.pushMessage(`Main ${nextIndex + 1} active.`);
      return;
    }

    const anyLiveHand = this.hands.some((hand) => !scoreHand(hand.cards).busted && !hand.surrendered);
    if (!anyLiveHand) {
      this.revealDealerHole();
      this.settleHands();
      this.finishRound("Toutes les mains sont terminees.");
      return;
    }

    this.playDealer();
  }

  playDealer() {
    this.phase = "dealer";
    this.revealDealerHole();

    while (true) {
      const score = scoreHand(this.dealer);
      const shouldHit = score.total < 17 || (score.total === 17 && score.soft && this.settings.dealerHitsSoft17);
      if (!shouldHit) {
        break;
      }
      this.dealer.push(this.dealCard());
    }

    this.settleHands();
    this.finishRound("Manche resolue.");
  }

  settleHands() {
    const dealerScore = scoreHand(this.dealer);
    for (const hand of this.hands) {
      if (hand.settled) {
        continue;
      }

      const playerScore = scoreHand(hand.cards);
      if (playerScore.busted) {
        this.payLoss(hand, "Bust");
      } else if (dealerScore.busted) {
        this.payWin(hand, "Dealer bust");
      } else if (playerScore.total > dealerScore.total) {
        this.payWin(hand, "Gagne");
      } else if (playerScore.total < dealerScore.total) {
        this.payLoss(hand, "Perdu");
      } else {
        this.payPush(hand, "Push");
      }
    }
  }

  payWin(hand, result) {
    const payout = normalizeAmount(hand.bet * 2);
    this.bankroll = normalizeAmount(this.bankroll + payout);
    hand.settled = true;
    hand.result = result;
    hand.payout = payout;
    this.stats.wins += 1;
    this.stats.net = normalizeAmount(this.stats.net + hand.bet);
  }

  payLoss(hand, result) {
    hand.settled = true;
    hand.result = result;
    hand.payout = 0;
    this.stats.losses += 1;
    this.stats.net = normalizeAmount(this.stats.net - hand.bet);
  }

  payPush(hand, result) {
    this.bankroll = normalizeAmount(this.bankroll + hand.bet);
    hand.settled = true;
    hand.result = result;
    hand.payout = hand.bet;
    this.stats.pushes += 1;
  }

  finishRound(message) {
    this.phase = "roundOver";
    this.activeHandIndex = 0;
    this.stats.roundsPlayed += 1;
    this.stats.handsPlayed += this.hands.length;
    this.discard.push(...this.dealer, ...this.hands.flatMap((hand) => hand.cards));
    this.hiddenCards = [];
    this.pushMessage(message);
  }

  getVisibleDealerCards() {
    return this.dealer.map((card, index) => ({
      ...card,
      hidden: index === 1 && !card.seen && !["dealer", "roundOver"].includes(this.phase)
    }));
  }

  getPublicState() {
    return {
      settings: { ...this.settings },
      phase: this.phase,
      round: this.round,
      bankroll: this.bankroll,
      lastBet: this.lastBet,
      insuranceBet: this.insuranceBet,
      dealer: this.getVisibleDealerCards(),
      dealerScore: this.dealerScoreLabel(),
      hands: this.hands.map((hand, index) => ({
        ...hand,
        score: scoreHand(hand.cards),
        scoreLabel: scoreLabelFor(hand.cards),
        active: this.phase === "player" && index === this.activeHandIndex
      })),
      activeHandIndex: this.activeHandIndex,
      actions: this.availableActions(),
      messages: [...this.messages],
      stats: { ...this.stats },
      training: this.trainingSnapshot()
    };
  }

  dealerScoreLabel() {
    const hidden = this.dealer.some((card, index) => index === 1 && !card.seen && !["dealer", "roundOver"].includes(this.phase));
    if (hidden) {
      return `${scoreLabelFor([this.dealer[0]])} + ?`;
    }
    return scoreLabelFor(this.dealer);
  }

  trainingSnapshot() {
    const totalCards = this.settings.decks * 52;
    const cardsRemaining = this.shoe.length;
    const decksRemaining = Math.max(cardsRemaining / 52, 0.1);
    const trueCount = this.runningCount / decksRemaining;
    const remaining = compositionFor(this.shoe);
    const seen = compositionFor(this.seenCards);
    const removed = compositionFor([...this.seenCards, ...this.hiddenCards]);
    const baseHighDensity = 20 / 52;
    const baseLowDensity = 20 / 52;
    const highDensity = cardsRemaining ? remaining.high / cardsRemaining : 0;
    const lowDensity = cardsRemaining ? remaining.low / cardsRemaining : 0;
    const highSurplus = highDensity - baseHighDensity;
    const lowSurplus = lowDensity - baseLowDensity;
    const countSign = Math.sign(trueCount);
    const exactSign = Math.sign(highSurplus - lowSurplus);

    return {
      system: this.currentCountSystem(),
      runningCount: this.runningCount,
      trueCount,
      cardsRemaining,
      decksRemaining,
      penetration: totalCards ? 1 - cardsRemaining / totalCards : 0,
      seenCards: this.seenCards.length,
      unseenRemovedCards: this.hiddenCards.length,
      remaining,
      seen,
      removed,
      highDensity,
      lowDensity,
      highSurplus,
      lowSurplus,
      estimateAgreement: countSign === 0 || exactSign === 0 ? "neutre" : countSign === exactSign ? "alignee" : "divergente"
    };
  }
}
