const TEN_VALUE_RANKS = ["10", "J", "Q", "K"];

const VALUE_GROUPS = [
  { label: "Valeur 10", detail: "10, J, Q, K", ranks: TEN_VALUE_RANKS },
  { label: "As", detail: "A", ranks: ["A"] },
  { label: "9", detail: "9", ranks: ["9"] },
  { label: "8", detail: "8", ranks: ["8"] },
  { label: "7", detail: "7", ranks: ["7"] },
  { label: "6", detail: "6", ranks: ["6"] },
  { label: "5", detail: "5", ranks: ["5"] },
  { label: "4", detail: "4", ranks: ["4"] },
  { label: "3", detail: "3", ranks: ["3"] },
  { label: "2", detail: "2", ranks: ["2"] }
];

const ACTION_LABELS = {
  deal: "Miser / distribuer",
  double: "Doubler",
  hit: "Tirer",
  insurance: "Prendre assurance",
  none: "Aucune action",
  skipInsurance: "Passer assurance",
  split: "Split",
  stand: "Rester",
  surrender: "Abandon",
  wait: "Attendre"
};

function rankValue(rank) {
  if (rank === "A") {
    return 11;
  }
  if (TEN_VALUE_RANKS.includes(rank)) {
    return 10;
  }
  return Number(rank);
}

function activeHand(state) {
  return state.hands[state.activeHandIndex] || null;
}

function dealerUpValue(state) {
  const upcard = state.dealer.find((card) => !card.hidden);
  return upcard ? rankValue(upcard.rank) : 0;
}

function hasAce(hand) {
  return hand.cards.some((card) => card.rank === "A");
}

function pairValue(hand) {
  if (!hand || hand.cards.length !== 2) {
    return 0;
  }
  const [first, second] = hand.cards;
  const firstValue = rankValue(first.rank);
  const secondValue = rankValue(second.rank);
  return firstValue === secondValue ? firstValue : 0;
}

function makeAdvice(actionKey, reason, mode = "Strategie de base", fallbackKey = "") {
  return {
    actionKey,
    actionLabel: ACTION_LABELS[actionKey],
    fallbackKey,
    mode,
    reason
  };
}

function pairAdvice(pair, dealerValue) {
  if (pair === 11 || pair === 8) {
    return makeAdvice("split", "Les As et les 8 se jouent mieux separes: tu crees deux mains plus fortes.", "Strategie paires", "hit");
  }
  if (pair === 10) {
    return makeAdvice("stand", "Deux cartes de valeur 10 font deja 20: c'est une main tres forte.", "Strategie paires");
  }
  if (pair === 9) {
    return [2, 3, 4, 5, 6, 8, 9].includes(dealerValue)
      ? makeAdvice("split", "9-9 se split contre les cartes dealer faibles ou moyennes.", "Strategie paires", "stand")
      : makeAdvice("stand", "Contre 7, 10 ou As, garde ton 18 plutot que de separer.", "Strategie paires");
  }
  if (pair === 7) {
    return dealerValue >= 2 && dealerValue <= 7
      ? makeAdvice("split", "7-7 profite d'un dealer faible ou moyen.", "Strategie paires", "hit")
      : makeAdvice("hit", "Contre une carte forte du dealer, mieux vaut chercher a ameliorer 14.", "Strategie paires");
  }
  if (pair === 6) {
    return dealerValue >= 2 && dealerValue <= 6
      ? makeAdvice("split", "6-6 se split quand le dealer risque de bust.", "Strategie paires", "hit")
      : makeAdvice("hit", "Contre 7 ou plus, garde les 12 points comme main a ameliorer.", "Strategie paires");
  }
  if (pair === 5) {
    return dealerValue >= 2 && dealerValue <= 9
      ? makeAdvice("double", "5-5 vaut 10: double contre une carte dealer pas trop forte.", "Strategie paires", "hit")
      : makeAdvice("hit", "Contre 10 ou As, double est trop fragile: tire une carte.", "Strategie paires");
  }
  if (pair === 4) {
    return [5, 6].includes(dealerValue)
      ? makeAdvice("split", "4-4 peut se split contre 5 ou 6 si la table permet de doubler apres split.", "Strategie paires", "hit")
      : makeAdvice("hit", "4-4 reste une petite main: tire sauf contre 5 ou 6 avec split favorable.", "Strategie paires");
  }
  if (pair === 2 || pair === 3) {
    return dealerValue >= 2 && dealerValue <= 7
      ? makeAdvice("split", "Petites paires: split contre 2 a 7 pour attaquer un dealer vulnerable.", "Strategie paires", "hit")
      : makeAdvice("hit", "Contre 8 ou plus, le split est trop expose: tire.", "Strategie paires");
  }
  return null;
}

function softAdvice(total, dealerValue) {
  if (total >= 20) {
    return makeAdvice("stand", "Soft 20 ou plus est deja tres fort.", "Strategie soft");
  }
  if (total === 19) {
    return dealerValue === 6
      ? makeAdvice("double", "Soft 19 peut doubler contre 6, une carte dealer tres vulnerable.", "Strategie soft", "stand")
      : makeAdvice("stand", "Soft 19 est assez fort pour rester.", "Strategie soft");
  }
  if (total === 18) {
    if (dealerValue >= 3 && dealerValue <= 6) {
      return makeAdvice("double", "Soft 18 double contre 3 a 6 pour profiter du risque de bust dealer.", "Strategie soft", "stand");
    }
    if ([2, 7, 8].includes(dealerValue)) {
      return makeAdvice("stand", "Soft 18 tient bien contre 2, 7 ou 8.", "Strategie soft");
    }
    return makeAdvice("hit", "Contre 9, 10 ou As, soft 18 doit chercher mieux.", "Strategie soft");
  }
  if (total === 17) {
    return dealerValue >= 3 && dealerValue <= 6
      ? makeAdvice("double", "Soft 17 double contre 3 a 6.", "Strategie soft", "hit")
      : makeAdvice("hit", "Soft 17 peut progresser sans risque immediat de bust.", "Strategie soft");
  }
  if (total === 15 || total === 16) {
    return dealerValue >= 4 && dealerValue <= 6
      ? makeAdvice("double", "Soft 15/16 double contre 4 a 6.", "Strategie soft", "hit")
      : makeAdvice("hit", "Soft 15/16 doit encore s'ameliorer.", "Strategie soft");
  }
  return dealerValue >= 5 && dealerValue <= 6
    ? makeAdvice("double", "Soft 13/14 double surtout contre 5 ou 6.", "Strategie soft", "hit")
    : makeAdvice("hit", "Main soft basse: tire pour construire une vraie main.", "Strategie soft");
}

function hardAdvice(total, dealerValue, actions, trueCount) {
  if (total >= 17) {
    return makeAdvice("stand", "17 ou plus: le risque de bust devient trop important.", "Strategie hard");
  }
  if (total === 16) {
    if (dealerValue === 10 && trueCount >= 0) {
      return makeAdvice("stand", "Deviation Hi-Lo: 16 contre 10 peut rester quand le true count est au moins neutre.", "Count deviation");
    }
    if ([9, 10, 11].includes(dealerValue) && actions.surrender) {
      return makeAdvice("surrender", "16 contre carte forte dealer est tres fragile: abandon tardif limite la perte.", "Strategie hard", "hit");
    }
    return dealerValue >= 2 && dealerValue <= 6
      ? makeAdvice("stand", "16 reste contre 2 a 6 car le dealer peut bust.", "Strategie hard")
      : makeAdvice("hit", "16 contre 7 ou plus doit tenter de s'ameliorer.", "Strategie hard");
  }
  if (total === 15) {
    if (dealerValue === 10 && trueCount >= 4) {
      return makeAdvice("stand", "Deviation avancee: 15 contre 10 peut rester avec un true count tres positif.", "Count deviation");
    }
    if (dealerValue === 10 && actions.surrender) {
      return makeAdvice("surrender", "15 contre 10 est un bon spot d'abandon tardif.", "Strategie hard", "hit");
    }
    return dealerValue >= 2 && dealerValue <= 6
      ? makeAdvice("stand", "15 reste contre 2 a 6 pour laisser le dealer prendre le risque.", "Strategie hard")
      : makeAdvice("hit", "15 contre 7, 8, 9, 10 ou As doit tirer.", "Strategie hard");
  }
  if (total >= 13) {
    return dealerValue >= 2 && dealerValue <= 6
      ? makeAdvice("stand", "13-14 reste contre 2 a 6.", "Strategie hard")
      : makeAdvice("hit", "13-14 contre 7 ou plus doit tirer.", "Strategie hard");
  }
  if (total === 12) {
    if (dealerValue === 3 && trueCount >= 2) {
      return makeAdvice("stand", "Deviation Hi-Lo: 12 contre 3 reste avec true count positif.", "Count deviation");
    }
    if (dealerValue === 2 && trueCount >= 3) {
      return makeAdvice("stand", "Deviation Hi-Lo: 12 contre 2 reste seulement avec true count tres positif.", "Count deviation");
    }
    return dealerValue >= 4 && dealerValue <= 6
      ? makeAdvice("stand", "12 reste contre 4 a 6.", "Strategie hard")
      : makeAdvice("hit", "12 contre 2, 3, 7 ou plus doit tirer.", "Strategie hard");
  }
  if (total === 11) {
    return dealerValue === 11
      ? makeAdvice("hit", "11 contre As reste prudent ici: tire une carte.", "Strategie hard")
      : makeAdvice("double", "11 double contre presque toutes les cartes dealer.", "Strategie hard", "hit");
  }
  if (total === 10) {
    return dealerValue >= 2 && dealerValue <= 9
      ? makeAdvice("double", "10 double contre 2 a 9.", "Strategie hard", "hit")
      : makeAdvice("hit", "10 contre 10 ou As doit tirer.", "Strategie hard");
  }
  if (total === 9) {
    return dealerValue >= 3 && dealerValue <= 6
      ? makeAdvice("double", "9 double contre 3 a 6.", "Strategie hard", "hit")
      : makeAdvice("hit", "9 tire contre 2, 7 ou plus.", "Strategie hard");
  }
  return makeAdvice("hit", "8 ou moins: tire, tu ne peux pas bust.", "Strategie hard");
}

function fallbackAdvice(advice, state, hand) {
  if (!advice || !state.actions) {
    return advice;
  }
  if (state.actions[advice.actionKey]) {
    return advice;
  }

  const fallbackKey = advice.fallbackKey && state.actions[advice.fallbackKey]
    ? advice.fallbackKey
    : "";
  const actionKey = fallbackKey
    || (state.actions.hit && hand.score.total < 17 ? "hit" : "")
    || (state.actions.stand ? "stand" : "")
    || (state.actions.hit ? "hit" : "none");

  if (actionKey === advice.actionKey) {
    return advice;
  }

  return makeAdvice(
    actionKey,
    `${advice.actionLabel} serait le plan ideal, mais l'action n'est pas disponible maintenant. Option de secours: ${ACTION_LABELS[actionKey]}.`,
    advice.mode
  );
}

export function mostLikelyNextCard(training) {
  const byRank = training.remaining.byRank;
  const total = training.cardsRemaining || 0;
  const best = VALUE_GROUPS.map((group) => ({
    ...group,
    count: group.ranks.reduce((sum, rank) => sum + (byRank[rank] || 0), 0)
  })).sort((left, right) => right.count - left.count)[0];

  return {
    count: best?.count || 0,
    detail: best?.detail || "",
    label: best?.label || "Aucune",
    probability: total ? (best?.count || 0) / total : 0,
    remaining: total
  };
}

export function recommendNextAction(state) {
  if (state.phase === "insurance") {
    if (state.training.trueCount >= 3) {
      return makeAdvice("insurance", "True count eleve: l'assurance devient interessante car les cartes de valeur 10 sont plus denses.", "Count deviation");
    }
    return makeAdvice("skipInsurance", "Passe l'assurance la plupart du temps; elle coute cher si le sabot n'est pas tres riche en 10.", "Strategie assurance");
  }

  if (["betting", "roundOver"].includes(state.phase)) {
    return makeAdvice("deal", "Aucune decision de main pour l'instant. Choisis une mise, puis distribue.", "Preparation");
  }

  if (state.phase !== "player") {
    return makeAdvice("wait", "Pas de decision joueur maintenant: attends la resolution de la phase en cours.", "Timing");
  }

  const hand = activeHand(state);
  const dealerValue = dealerUpValue(state);
  if (!hand || !dealerValue) {
    return makeAdvice("none", "Information insuffisante pour proposer une action.", "Timing");
  }
  if (hand.score.total === 21) {
    return makeAdvice("wait", "21 atteint: la main se termine automatiquement, aucune action joueur n'est necessaire.", "Timing");
  }

  const pair = pairValue(hand);
  let advice = pair && state.actions.split ? pairAdvice(pair, dealerValue) : null;
  if (!advice) {
    advice = hasAce(hand) && hand.score.soft
      ? softAdvice(hand.score.total, dealerValue)
      : hardAdvice(hand.score.total, dealerValue, state.actions, state.training.trueCount);
  }

  return fallbackAdvice(advice, state, hand);
}
