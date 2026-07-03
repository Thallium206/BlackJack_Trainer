import assert from "node:assert/strict";
import test from "node:test";
import { COUNT_SYSTEMS } from "../src/game.js";
import { COUNTING_GUIDES, guideForCountSystem } from "../src/counting-info.js";

test("every selectable count system has a detailed guide", () => {
  for (const system of Object.values(COUNT_SYSTEMS)) {
    const guide = COUNTING_GUIDES[system.id];
    assert.ok(guide, `${system.id} should expose a guide`);
    assert.equal(guide.title, system.label);
    assert.ok(guide.summary.length > 40);
    assert.ok(guide.values.length >= 3);
    assert.ok(guide.howTo.length >= 3);
    assert.ok(guide.useCases.length >= 3);
    assert.ok(guide.traps.length >= 3);
  }
});

test("guideForCountSystem returns the selected counting method guide", () => {
  assert.equal(guideForCountSystem("omegaII").title, "Omega II");
  assert.equal(guideForCountSystem("zen").balance, "Balance niveau 2");
});

test("guideForCountSystem falls back to Hi-Lo", () => {
  assert.equal(guideForCountSystem("unknown").title, "Hi-Lo");
});
