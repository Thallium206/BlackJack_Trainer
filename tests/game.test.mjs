import assert from "node:assert/strict";
import test from "node:test";
import {
  BlackjackGame,
  COUNT_SYSTEMS,
  DEFAULT_SETTINGS,
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

test("default table starts with a two-deck shoe", () => {
  assert.equal(DEFAULT_SETTINGS.decks, 2);
  const game = new BlackjackGame();
  assert.equal(game.trainingSnapshot().cardsRemaining, 104);
});

test("scoreLabelFor shows hard and soft totals when an ace can flex", () => {
  assert.equal(scoreLabelFor([createCard("A"), createCard("6")]), "7 (17 soft)");
  assert.equal(scoreLabelFor([createCard("A"), createCard("9"), createCard("8")]), "18 hard");
  assert.equal(scoreLabelFor([createCard("10"), createCard("7")]), "17");
});

test("hitting to 21 automatically locks and resolves the hand", () => {
  const game = new BlackjackGame({ decks: 1 });
  game.phase = "player";
  game.bankroll = 90;
  game.hands = [{
    bet: 10,
    cards: [createCard("10"), createCard("5")],
    doubled: false,
    id: "hand-1",
    locked: false,
    payout: 0,
    result: "",
    settled: false,
    source: "initial",
    splitAces: false,
    surrendered: false
  }];
  game.activeHandIndex = 0;
  game.dealer = [createCard("10"), createCard("7")];
  game.shoe = [createCard("6")];

  game.hit();

  assert.equal(game.phase, "roundOver");
  assert.equal(game.hands[0].result, "21 gagne");
  assert.equal(game.hands[0].locked, true);
  assert.equal(game.availableActions().hit, false);
  assert.equal(game.availableActions().stand, false);
  assert.ok(game.messages.some((message) => message.includes("21 !")));
});

test("a player hand already on 21 exposes no manual actions", () => {
  const game = new BlackjackGame({ decks: 1 });
  game.phase = "player";
  game.hands = [{
    bet: 10,
    cards: [createCard("10"), createCard("5"), createCard("6")],
    doubled: false,
    id: "hand-1",
    locked: false,
    payout: 0,
    result: "",
    settled: false,
    source: "initial",
    splitAces: false,
    surrendered: false
  }];

  const actions = game.availableActions();
  assert.equal(actions.hit, false);
  assert.equal(actions.stand, false);
  assert.equal(actions.double, false);
  assert.equal(actions.split, false);
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
