#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { parseBalatroSeedMarkdown, toJinaReaderUrl } from "./extract-balatroseed-route.mjs";

async function readFixture(name) {
  return fs.readFile(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

const queueSample = await readFixture("balatroseed-queue-sample.md");
const queueParsed = parseBalatroSeedMarkdown(queueSample, {
  sourceId: "balatroseeds-y3qrzz5i"
});

assert.equal(queueParsed.seed, "Y3QRZZ5I");
assert.equal(queueParsed.deck, "Yellow Deck");
assert.equal(queueParsed.detail.queueTables.length, 2);
assert.equal(queueParsed.detail.queueTables[0].boss, "The Pillar");
assert.equal(queueParsed.detail.queueTables[0].voucher, "Seed Money");
assert.deepEqual(queueParsed.detail.queueTables[0].tags, ["D6 Tag", "Rare Tag"]);
assert.equal(queueParsed.detail.queueTables[0].shopQueue[0], "Certificate");
assert.equal(queueParsed.detail.queueTables[1].shopQueue[1], "Brainstorm");
assert.equal(queueParsed.detail.queueTables[1].packs[1], "Spectral Pack - Ankh, Medium");
assert.equal(queueParsed.detail.queueTables[0].sourceIds[0], "balatroseeds-y3qrzz5i");
assert.match(queueParsed.detail.flow[0].actions.join(" "), /Play first tag/);

const proseSample = await readFixture("balatroseed-prose-sample.md");
const proseParsed = parseBalatroSeedMarkdown(proseSample);

assert.equal(proseParsed.seed, "8Q47WV6K");
assert.equal(proseParsed.deck, "Ghost Deck");
assert.equal(proseParsed.detail.flow.length, 2);
assert.equal(proseParsed.detail.flow[1].stage, "Ante 8-13");
assert.match(proseParsed.warnings[0], /Seed candidates differ/);
assert.equal(toJinaReaderUrl("https://balatroseeds.com/seeds/Y3QRZZ5I/yellow-deck"), "https://r.jina.ai/http://balatroseeds.com/seeds/Y3QRZZ5I/yellow-deck");

console.log("BalatroSeeds extractor tests passed");
