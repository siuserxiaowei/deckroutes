#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const siteData = JSON.parse(fs.readFileSync("assets/data/site-data.json", "utf8"));
const routeData = JSON.parse(fs.readFileSync("assets/data/route-data.json", "utf8"));

const seeds = [...(siteData.seeds || []), ...(routeData.additionalSeeds || [])];
const seedById = new Map(seeds.map((seed) => [seed.seed, seed]));
const sourceMap = {
  ...(siteData.sources || {}),
  ...(routeData.sourceAdditions || {})
};

const harvestedSeed = seedById.get("BUMBYCX2");
assert.ok(harvestedSeed, "BUMBYCX2 should be promoted from Bilibili source into the seed database");
assert.ok(harvestedSeed.sources?.includes("bili-bumbycx2-steel-k-route"));
assert.match(harvestedSeed.summary || "", /免费\s*DNA|钢铁\s*K|43\s*张/);

const harvestedDetail = routeData.seedDetails?.BUMBYCX2;
assert.ok(harvestedDetail, "BUMBYCX2 should have a route detail");
assert.match(harvestedDetail.completeness || "", /阶段路线|待复盘/);
assert.ok((harvestedDetail.flow || []).length >= 6, "BUMBYCX2 should capture the Bilibili description as staged route nodes");
const routeText = (harvestedDetail.flow || [])
  .flatMap((stage) => [stage.stage, ...(stage.actions || [])])
  .join("\n");
for (const requiredText of ["免费\\s*DNA", "红蜡", "复制标签", "男爵", "哑剧", "43\\s*张以上", "红色封蜡钢铁\\s*K"]) {
  assert.match(routeText, new RegExp(requiredText), `BUMBYCX2 route should include ${requiredText}`);
}

assert.equal(
  sourceMap["bili-bumbycx2-steel-k-route"]?.url,
  "https://www.bilibili.com/video/BV1LNCGY3ESd/"
);

const evidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-bumbycx2-steel-k-route");
assert.ok(evidence, "BUMBYCX2 should have an evidence card");
assert.ok(evidence.seeds?.includes("BUMBYCX2"));
assert.ok((evidence.facts || []).length >= 5, "BUMBYCX2 evidence should preserve source-backed route facts");

const queueItem = (siteData.reviewQueue || []).find((item) => item.id === "bili-bumbycx2-video-replay");
assert.ok(queueItem, "BUMBYCX2 should stay in the replay queue for video/OCR completion");
assert.ok(queueItem.targetSeeds?.includes("BUMBYCX2"));

const queueSeed = seedById.get("12QM45YD");
assert.ok(queueSeed, "12QM45YD should be promoted from BalatroSeeds queue extraction into the seed database");
assert.ok(queueSeed.sources?.includes("balatroseeds-12qm45yd-plasma"));
assert.match(queueSeed.summary || "", /Ante 1-6|Baron|Antimatter|Sock and Buskin/);

const queueDetail = routeData.seedDetails?.["12QM45YD"];
assert.ok(queueDetail, "12QM45YD should have a route detail");
assert.match(queueDetail.completeness || "", /Ante 1-6/);
assert.ok((queueDetail.flow || []).length >= 6, "12QM45YD should expose all six parsed Ante stages");
assert.ok((queueDetail.queueTables || []).length >= 6, "12QM45YD should preserve parsed queue tables");
const queueRouteText = [
  ...(queueDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(queueDetail.queueTables || []).flatMap((table) => [
    table.boss,
    table.voucher,
    ...(table.tags || []),
    ...(table.shopQueue || []),
    ...(table.packs || [])
  ])
].join("\n");
for (const requiredText of [
  "The Window",
  "Baron",
  "The Soul",
  "Deja Vu",
  "Cryptid",
  "Antimatter",
  "Hanging Chad",
  "Sock and Buskin"
]) {
  assert.match(queueRouteText, new RegExp(requiredText), `12QM45YD queue route should include ${requiredText}`);
}

assert.equal(
  sourceMap["balatroseeds-12qm45yd-plasma"]?.url,
  "https://balatroseeds.com/seeds/12QM45YD/plasma-deck"
);

const queueEvidence = (siteData.evidenceSources || []).find((item) => item.id === "balatroseeds-12qm45yd-plasma");
assert.ok(queueEvidence, "12QM45YD should have an evidence card");
assert.ok(queueEvidence.seeds?.includes("12QM45YD"));
assert.ok((queueEvidence.facts || []).length >= 5, "12QM45YD evidence should preserve source-backed queue facts");

const queueReplayItem = (siteData.reviewQueue || []).find((item) => item.id === "balatroseeds-12qm45yd-plasma-replay");
assert.ok(queueReplayItem, "12QM45YD should stay in the replay queue for decision validation");
assert.ok(queueReplayItem.targetSeeds?.includes("12QM45YD"));

console.log("Route harvest contracts passed");
