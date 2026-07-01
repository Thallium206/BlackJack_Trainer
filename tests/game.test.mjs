import assert from "node:assert/strict";
import test from "node:test";
import {
  BlackjackGame,
  COUNT_SYSTEMS,
  createCard,
  makeShoe,
  scoreHand,
  scoreLabelFor
} from "../src/game.js";

test("scoreHand handles soft totals, blackjack and busts", () => {
  assert.deepEqual(scoreHand([createCard("A"), createCard("K")]), {
    total: 21,
    soft: true,
    busted: false,
    blackjack: true
  });

  const softTwentyOne = scoreHand([createCard("A"), createCard("9"), createCard("A")]);
  assert.equal(softTwentyOne.total, 21);
  assert.equal(softTwentyOne.soft, true);
  assert.equal(softTwentyOne.blackjack, false);

  const bust = scoreHand([createCard("K"), createCard("9"), createCard("5")]);
  assert.equal(bust.total, 24);
  assert.equal(bust.busted, true);
});

test("makeShoe creates the expected number of cards", () => {
  const shoe = makeShoe(6);
  assert.equal(shoe.length, 312);
  assert.equal(shoe.filter((card) => card.rank === "A").length, 24);
  assert.equal(shoe.filter((card) => card.rank === "10").length, 24);
});

test("scoreLabelFor shows hard and soft totals when an ace can flex", () => {
  assert.equal(scoreLabelFor([createCard("A"), createCard("6")]), "7 (17 soft)");
  assert.equal(scoreLabelFor([createCard("A"), createCard("9"), createCard("8")]), "18 hard");
  assert.equal(scoreLabelFor([createCard("10"), createCard("7")]), "17");
});

test("Hi-Lo values are exposed for low, neutral and high cards", () => {
  assert.equal(COUNT_SYSTEMS.hiLo.values["2"], 1);
  assert.equal(COUNT_SYSTEMS.hiLo.values["8"], 0);
  assert.equal(COUNT_SYSTEMS.hiLo.values["A"], -1);
});

test("visible cards update running count while hidden cards wait for reveal", () => {
  const game = new BlackjackGame({ decks: 1 });
  game.shoe = [createCard("A"), createCard("2")];

  game.dealCard();
  assert.equal(game.runningCount, 1);

  const hidden = game.dealCard({ visible: false });
  assert.equal(hidden.rank, "A");
  assert.equal(game.runningCount, 1);
  assert.equal(game.trainingSnapshot().unseenRemovedCards, 1);

  game.dealer = [hidden];
  game.revealDealerHole();
  assert.equal(game.runningCount, 0);
});

test("training snapshot reports true count per deck remaining", () => {
  const game = new BlackjackGame({ decks: 1 });
  game.shoe = Array.from({ length: 52 }, (_, index) => createCard(index < 26 ? "2" : "K"));

  game.dealCard();
  game.dealCard();

  const snapshot = game.trainingSnapshot();
  assert.equal(snapshot.runningCount, -2);
  assert.ok(snapshot.trueCount < -1.9);
  assert.equal(snapshot.cardsRemaining, 50);
});
