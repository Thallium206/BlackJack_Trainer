import assert from "node:assert/strict";
import test from "node:test";
import {
  mostLikelyNextCard,
  recommendNextAction
} from "../src/advice.js";
import {
  BlackjackGame,
  createCard,
  scoreHand
} from "../src/game.js";

function stateFor({ cards, dealerRank, trueCount = 0, actions = {} }) {
  const game = new BlackjackGame();
  const hand = {
    cards,
    score: scoreHand(cards)
  };

  return {
    actions: {
      double: true,
      hit: true,
      split: false,
      stand: true,
      surrender: true,
      ...actions
    },
    activeHandIndex: 0,
    dealer: [{ hidden: false, rank: dealerRank, suit: "S" }],
    hands: [hand],
    phase: "player",
    training: {
      trueCount
    }
  };
}

test("mostLikelyNextCard groups all ten-value cards together", () => {
  const game = new BlackjackGame();
  const likely = mostLikelyNextCard(game.trainingSnapshot());

  assert.equal(likely.label, "Valeur 10");
  assert.equal(likely.count, 32);
  assert.equal(likely.remaining, 104);
  assert.equal(likely.probability, 32 / 104);
});

test("recommendNextAction suggests split for a pair of eights", () => {
  const advice = recommendNextAction(stateFor({
    actions: { split: true },
    cards: [createCard("8"), createCard("8")],
    dealerRank: "10"
  }));

  assert.equal(advice.actionKey, "split");
});

test("recommendNextAction suggests hit for soft 18 against dealer 9", () => {
  const advice = recommendNextAction(stateFor({
    cards: [createCard("A"), createCard("7")],
    dealerRank: "9"
  }));

  assert.equal(advice.actionKey, "hit");
});

test("recommendNextAction applies a simple count deviation", () => {
  const advice = recommendNextAction(stateFor({
    cards: [createCard("10"), createCard("6")],
    dealerRank: "10",
    trueCount: 1
  }));

  assert.equal(advice.actionKey, "stand");
  assert.equal(advice.mode, "Count deviation");
});

test("recommendNextAction does not suggest manual play on 21", () => {
  const advice = recommendNextAction(stateFor({
    cards: [createCard("10"), createCard("5"), createCard("6")],
    dealerRank: "10"
  }));

  assert.equal(advice.actionKey, "wait");
  assert.match(advice.reason, /21 atteint/);
});
