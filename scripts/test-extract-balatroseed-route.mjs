#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { htmlToMarkdownSnapshot, parseBalatroSeedMarkdown, resolveSourceUrl, toJinaReaderUrl } from "./extract-balatroseed-route.mjs";

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

const proseQueueSample = await readFixture("balatroseed-prose-queue-sample.md");
const proseQueueParsed = parseBalatroSeedMarkdown(proseQueueSample, {
  sourceId: "balatroseeds-6b678b4w"
});

assert.equal(proseQueueParsed.seed, "6B678B4W");
assert.equal(proseQueueParsed.deck, "Plasma Deck");
assert.ok((proseQueueParsed.detail.queueTables || []).length >= 4, "prose Ante sections should be promoted into queue tables");
assert.equal(proseQueueParsed.detail.queueTables[0].ante, 1);
assert.equal(proseQueueParsed.detail.queueTables[0].sourceIds[0], "balatroseeds-6b678b4w");
assert.match(proseQueueParsed.detail.queueTables[0].shopQueue.join("\n"), /Small Blind: Skip for Mega Arcana Pack|Rest of Ante: Buy Seed Money Immediately/);
assert.match(proseQueueParsed.detail.queueTables[0].packs.join("\n"), /Soul for Perkeo|High Priestess for Jupiter and Earth/);
const proseQueueAnte5 = proseQueueParsed.detail.queueTables.find((table) => table.ante === 5);
assert.ok(proseQueueAnte5, "Ante 5 prose section should become a queue table");
assert.match(proseQueueAnte5.shopQueue.join("\n"), /Reroll 3 times to \$111 for Stuntman|After the 7th reroll.*foil DNA|Sell Golden Joker and buy DNA/);
assert.match(proseQueueAnte5.packs.join("\n"), /Arcana Pack|Mega Arcana Packs|Deja vu|Chariot/);
const proseQueueAnte7 = proseQueueParsed.detail.queueTables.find((table) => table.ante === 7);
assert.match(proseQueueAnte7.shopQueue.join("\n"), /Buy Antimatter|Reroll until you hit Baron|Cryptid/);
assert.match(proseQueueParsed.detail.flow[0].actions.join(" "), /Shop Queue key order/i);

const ghostProseSample = await readFixture("balatroseed-8q47wv6k-prose-sample.md");
const ghostProseParsed = parseBalatroSeedMarkdown(ghostProseSample, {
  sourceId: "balatroseeds-8q47wv6k-ghost"
});
assert.equal(ghostProseParsed.seed, "8Q47WV6K");
assert.match(ghostProseParsed.warnings[0], /Seed candidates differ/);
assert.ok((ghostProseParsed.detail.queueTables || []).length >= 8, "8Q47WV6K prose sections should become route tables");
assert.equal(ghostProseParsed.detail.queueTables[0].sourceIds[0], "balatroseeds-8q47wv6k-ghost");
assert.equal(ghostProseParsed.detail.queueTables[0].tags.length, 0, "Legendary jokers from prose must not be mislabelled as Tags");
assert.equal(ghostProseParsed.detail.queueTables.find((table) => table.ante === 9).tags.length, 0);
assert.match(ghostProseParsed.detail.queueTables[0].shopQueue.join("\n"), /hex-Triboulet and Perkeo/);
assert.match(ghostProseParsed.detail.queueTables.find((table) => table.ante === 13).shopQueue.join("\n"), /Showman|DNA|sock and buskin/i);

const htmlMetaSample = await readFixture("balatroseed-html-meta-sample.html");
const htmlMetaMarkdown = htmlToMarkdownSnapshot(htmlMetaSample, "https://balatroseeds.com/seeds/Y3QRZZ5I/yellow-deck");
assert.match(htmlMetaMarkdown, /Don't treat this as a verified route/);
const htmlMetaParsed = parseBalatroSeedMarkdown(htmlMetaMarkdown, {
  sourceId: "balatroseeds-y3qrzz5i"
});
assert.equal(htmlMetaParsed.seed, "Y3QRZZ5I");
assert.equal(htmlMetaParsed.deck, "Yellow Deck");
assert.equal(htmlMetaParsed.detail.queueTables.length, 1);
assert.equal(htmlMetaParsed.detail.queueTables[0].shopQueue[0], "Certificate");
assert.equal(htmlMetaParsed.detail.queueTables[0].packs[0], "Spectral Pack - Ankh, Medium");

const sectionProseSample = await readFixture("balatroseed-section-prose-sample.html");
const sectionProseMarkdown = htmlToMarkdownSnapshot(sectionProseSample, "https://balatroseeds.com/seeds/AFBWB2/ghost-deck");
const sectionProseParsed = parseBalatroSeedMarkdown(sectionProseMarkdown, {
  sourceId: "balatroseeds-afbwb2-ghost"
});
assert.equal(sectionProseParsed.seed, "AFBWB2");
assert.equal(sectionProseParsed.deck, "Ghost Deck");
assert.deepEqual(sectionProseParsed.detail.flow.map((stage) => stage.stage), ["Blind", "Shop", "Continuation"]);
assert.match(sectionProseParsed.detail.flow[1].actions.join(" "), /blueprint/i);
assert.match(sectionProseParsed.detail.flow[2].actions.join(" "), /perfect kings/);

assert.equal(
  resolveSourceUrl("route-source", {
    sources: {
      "site-source": {
        url: "https://example.com/site"
      }
    }
  }, {
    sourceAdditions: {
      "route-source": {
        url: "https://example.com/route"
      }
    }
  }),
  "https://example.com/route"
);
assert.equal(
  resolveSourceUrl("site-source", {
    sources: {
      "site-source": {
        url: "https://example.com/site"
      }
    }
  }, {
    sourceAdditions: {}
  }),
  "https://example.com/site"
);
assert.throws(() => resolveSourceUrl("missing-source", { sources: {} }, { sourceAdditions: {} }), /Unknown source id/);

console.log("BalatroSeeds extractor tests passed");
