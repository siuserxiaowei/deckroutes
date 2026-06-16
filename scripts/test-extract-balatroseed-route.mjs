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
