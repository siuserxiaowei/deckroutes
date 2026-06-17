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
  .concat(harvestedDetail.mistakes || [])
  .join("\n");
for (const requiredText of ["免费\\s*DNA", "红蜡", "复制标签", "男爵", "哑剧", "43\\s*张以上", "红色封蜡钢铁\\s*K"]) {
  assert.match(routeText, new RegExp(requiredText), `BUMBYCX2 route should include ${requiredText}`);
}
assert.ok((harvestedDetail.flow || []).length >= 9, "BUMBYCX2 should expose API/comment-refined flow stages beyond the initial six-node outline");
assert.match(harvestedDetail.sourceMode || "", /API|Jina|评论|字幕/i);
for (const requiredText of [
  "zqz老赵",
  "2103",
  "第十七",
  "负片哑剧",
  "第十二",
  "第七张",
  "第二十一",
  "窃贼",
  "黑龟豆",
  "跳过小盲注",
  "大盲",
  "字幕接口为空",
  "HTTP 412"
]) {
  assert.match(routeText, new RegExp(requiredText, "i"), `BUMBYCX2 refined route should include ${requiredText}`);
}

assert.equal(
  sourceMap["bili-bumbycx2-steel-k-route"]?.url,
  "https://www.bilibili.com/video/BV1LNCGY3ESd/"
);

const evidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-bumbycx2-steel-k-route");
assert.ok(evidence, "BUMBYCX2 should have an evidence card");
assert.ok(evidence.seeds?.includes("BUMBYCX2"));
assert.ok((evidence.facts || []).length >= 5, "BUMBYCX2 evidence should preserve source-backed route facts");
assert.ok((evidence.facts || []).length >= 10, "BUMBYCX2 evidence should preserve API, description, subtitle, and comment facts");
assert.match(evidence.contentType || "", /API|Jina|评论|字幕/);
assert.match(evidence.useInSite || "", /第十七|第二十一|跳过小盲注|负片哑剧/);

const queueItem = (siteData.reviewQueue || []).find((item) => item.id === "bili-bumbycx2-video-replay");
assert.ok(queueItem, "BUMBYCX2 should stay in the replay queue for video/OCR completion");
assert.ok(queueItem.targetSeeds?.includes("BUMBYCX2"));
assert.match(queueItem.nextAction || "", /第十二|第十七|第二十一|跳过小盲注|黑龟豆|巨蟒/);

const versionSensitiveSeed = seedById.get("1DOYU2");
assert.ok(versionSensitiveSeed, "1DOYU2 should remain in the seed database");
assert.ok(versionSensitiveSeed.sources?.includes("bili-1doyu2"));
assert.match(versionSensitiveSeed.summary || "", /1\.0\.1f|Ante\s*39|naneinf|50\s*张\s*K/i);

const versionSensitiveDetail = routeData.seedDetails?.["1DOYU2"];
assert.ok(versionSensitiveDetail, "1DOYU2 should have an upgraded route detail");
assert.match(versionSensitiveDetail.completeness || "", /B站|API|评论|版本敏感|待复盘/i);
assert.ok((versionSensitiveDetail.flow || []).length >= 6, "1DOYU2 should expose staged Bilibili/API/comment facts instead of a two-node placeholder");
const versionSensitiveText = [
  ...(versionSensitiveDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(versionSensitiveDetail.mistakes || [])
].join("\n");
for (const requiredText of [
  "Ghost Deck",
  "幽灵牌组",
  "1.0.1f",
  "Ante 39",
  "naneinf",
  "50张K",
  "Blueprint",
  "蓝图",
  "Brainstorm",
  "头脑风暴",
  "Negative Ringmaster",
  "负片马戏团长",
  "220多张牛头人",
  "Ectoplasm",
  "灵质",
  "两张手牌",
  "HTTP 412"
]) {
  assert.match(versionSensitiveText, new RegExp(requiredText, "i"), `1DOYU2 route should include ${requiredText}`);
}

const versionSensitiveEvidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-1doyu2");
assert.ok(versionSensitiveEvidence, "1DOYU2 should have a Bilibili evidence card");
assert.ok(versionSensitiveEvidence.seeds?.includes("1DOYU2"));
assert.ok((versionSensitiveEvidence.facts || []).length >= 8, "1DOYU2 evidence should preserve API, description, and comment facts");
assert.match(versionSensitiveEvidence.contentType || "", /API|评论|简介/);

const versionSensitiveQueue = (siteData.reviewQueue || []).find((item) => item.id === "bili-1doyu2-version-review");
assert.ok(versionSensitiveQueue, "1DOYU2 should stay in the version-sensitive replay queue");
assert.ok(versionSensitiveQueue.targetSeeds?.includes("1DOYU2"));
assert.match(versionSensitiveQueue.nextAction || "", /1\.0\.1f|50\s*张\s*K|灵质|负片马戏团长/);

assert.ok(
  versionSensitiveSeed.sources?.includes("bili-1doyu2-e14219-full-flow"),
  "1DOYU2 should link the newer e14219 full-flow Bilibili source"
);
assert.equal(
  sourceMap["bili-1doyu2-e14219-full-flow"]?.url,
  "https://www.bilibili.com/video/BV1xWwTetEfX/"
);
assert.ok(
  (versionSensitiveDetail.sources || []).includes("bili-1doyu2-e14219-full-flow"),
  "1DOYU2 detail should cite the e14219 source"
);
assert.ok((versionSensitiveDetail.flow || []).length >= 10, "1DOYU2 should expose a richer staged flow from the e14219 description");
const e14219RequiredTerms = [
  "等离子",
  "e14219",
  "961",
  "红封钢K",
  "高牌",
  "217",
  "5\\s*蓝图",
  "3\\s*头脑风暴",
  "帕奇欧",
  "Perkeo",
  "男爵",
  "Baron",
  "哑剧",
  "Mime",
  "1-1",
  "39-3",
  "巨蟒",
  "手机和电脑"
];
for (const requiredText of e14219RequiredTerms) {
  assert.match(versionSensitiveText, new RegExp(requiredText, "i"), `1DOYU2 e14219 route should include ${requiredText}`);
}
const e14219Evidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-1doyu2-e14219-full-flow");
assert.ok(e14219Evidence, "1DOYU2 should have a second Bilibili evidence card for the e14219 full-flow source");
assert.ok(e14219Evidence.seeds?.includes("1DOYU2"));
assert.ok((e14219Evidence.facts || []).length >= 10, "1DOYU2 e14219 evidence should preserve API, description, and comment facts");
assert.match(e14219Evidence.contentType || "", /API|简介|评论|Jina/);
assert.match(versionSensitiveQueue.nextAction || "", /BV1Ar421E7dv|BV1xWwTetEfX|等离子|Ghost Deck|961|39-3/);
assert.ok(
  (versionSensitiveDetail.queueTables || []).length >= 10,
  "1DOYU2 e14219 source should expose structured 1-1 to 39-3 route tables, not only prose flow nodes"
);
const e14219QueueText = (versionSensitiveDetail.queueTables || [])
  .flatMap((table) => [
    table.ante,
    table.title,
    table.boss,
    table.voucher,
    table.routeUse,
    ...(table.tags || []),
    ...(table.shopQueue || []),
    ...(table.packs || [])
  ])
  .join("\n");
for (const requiredText of [
  "1-1",
  "负片帕奇欧",
  "1-2",
  "优惠券标签",
  "2-1",
  "头脑风暴",
  "2-2",
  "红蜡",
  "5-1",
  "红封钢K",
  "8-1",
  "负片标签",
  "23-2",
  "DNA\\+男爵\\+哑剧\\+帕奇欧\\+5蓝图\\+2头脑风暴",
  "28注",
  "Boss",
  "神秘生物",
  "36-1",
  "38-3",
  "39-3",
  "巨蟒",
  "出牌次数.*剩1",
  "手机和电脑"
]) {
  assert.match(e14219QueueText, new RegExp(requiredText, "i"), `1DOYU2 structured e14219 table should include ${requiredText}`);
}
assert.match(
  versionSensitiveQueue.validation || "",
  /结构化|queueTables|1-1.*39-3|逐帧|roll|现金阈值/i,
  "1DOYU2 replay queue should distinguish structured description tables from still-missing video replay facts"
);

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

const longRunSeed = seedById.get("2K9H9HN");
assert.ok(longRunSeed, "2K9H9HN should be promoted from Bilibili full-flow evidence into the seed database");
assert.ok(longRunSeed.sources?.includes("bili-2k9h9hn-full-flow"));
assert.match(longRunSeed.summary || "", /84\s*分\s*P|同花五条|黄金牌|可乐/);

const longRunDetail = routeData.seedDetails?.["2K9H9HN"];
assert.ok(longRunDetail, "2K9H9HN should have a route detail");
assert.match(longRunDetail.completeness || "", /84\s*分\s*P|全流程/);
assert.ok((longRunDetail.flow || []).length >= 8, "2K9H9HN should expose grouped route stages from the Bilibili part list");
const longRunText = (longRunDetail.flow || [])
  .flatMap((stage) => [stage.stage, ...(stage.actions || [])])
  .join("\n");
for (const requiredText of ["开2张传奇负片", "隐形小丑", "可乐", "蓝图", "黄金牌", "负片", "大结局"]) {
  assert.match(longRunText, new RegExp(requiredText), `2K9H9HN route should include ${requiredText}`);
}

assert.equal(
  sourceMap["bili-2k9h9hn-full-flow"]?.url,
  "https://www.bilibili.com/video/BV1rhL3zREFe/"
);

const longRunEvidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-2k9h9hn-full-flow");
assert.ok(longRunEvidence, "2K9H9HN should have an evidence card");
assert.ok(longRunEvidence.seeds?.includes("2K9H9HN"));
assert.ok((longRunEvidence.facts || []).length >= 5, "2K9H9HN evidence should preserve source-backed full-flow facts");

const longRunQueueItem = (siteData.reviewQueue || []).find((item) => item.id === "bili-2k9h9hn-timeline-replay");
assert.ok(longRunQueueItem, "2K9H9HN should stay in the replay queue for timeline validation");
assert.ok(longRunQueueItem.targetSeeds?.includes("2K9H9HN"));

const redditSeed = seedById.get("1JA54YD6");
assert.ok(redditSeed, "1JA54YD6 should be promoted from the Reddit full guide into the seed database");
assert.ok(redditSeed.sources?.includes("reddit-1ja54yd6-full-guide"));
assert.match(redditSeed.summary || "", /Foil\s*DNA|Baron|Mime|red seal/i);

const redditDetail = routeData.seedDetails?.["1JA54YD6"];
assert.ok(redditDetail, "1JA54YD6 should have a route detail");
assert.match(redditDetail.completeness || "", /Reddit|candidate|待复盘/i);
assert.ok((redditDetail.flow || []).length >= 11, "1JA54YD6 should expose source provenance, staged route nodes, and uncertainty notes");
assert.match(redditDetail.sourceMode || "", /old\.reddit HTML|网页\/搜索|command-line direct Reddit JSON|Jina|blocked|安全页/i);
const redditRouteText = [
  ...(redditDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(redditDetail.mistakes || [])
]
  .join("\n");
for (const requiredText of ["Plasma", "Foil DNA", "red seal", "Stuntman", "Mime", "Brainstorm", "Baron", "Blueprint"]) {
  assert.match(redditRouteText, new RegExp(requiredText, "i"), `1JA54YD6 route should include ${requiredText}`);
}
for (const requiredText of [
  "Full guide",
  "\\[deleted\\]",
  "2025-07-21T05:10:24\\+00:00",
  "5 points",
  "79% upvoted",
  "comments.*感谢|评论.*感谢",
  "does not add route nodes|没有新增路线节点",
  "baron mime red seal steel king",
  "naneinf",
  "x1\\.5",
  "fourfold to eightfold",
  "foil skip goes onto dna",
  "red seal king of hearts in ante 2 jumbo standard pack",
  "red seal bonus king of hearts",
  "Don't copy this too much",
  "Crimson Heart",
  "third and fourth.*arcana packs.*Soul",
  "forgot what they had",
  "The Plant",
  "Luchador",
  "Chicot",
  "sell your legendaries",
  "around 24 rerolls",
  "forgot exact number",
  "6 to 7 times every shop",
  "\\$170",
  "around 12 rerolls",
  "5 rerolls",
  "Antimatter",
  "Perkeo",
  "Observatory"
]) {
  assert.match(redditRouteText, new RegExp(requiredText, "i"), `1JA54YD6 route should include ${requiredText}`);
}

assert.equal(
  sourceMap["reddit-1ja54yd6-full-guide"]?.url,
  "https://www.reddit.com/r/balatro/comments/1m5a7tq/full_guide_early_foil_dna_stuntman_red_seal_late/"
);

const redditEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-1ja54yd6-full-guide");
assert.ok(redditEvidence, "1JA54YD6 should have an evidence card");
assert.ok(redditEvidence.seeds?.includes("1JA54YD6"));
assert.ok((redditEvidence.facts || []).length >= 12, "1JA54YD6 evidence should preserve source metadata, route facts, comment status, and uncertainty boundaries");
assert.match(redditEvidence.contentType || "", /old\.reddit HTML|command-line direct Reddit JSON|Jina|安全页|blocked/i);
assert.match((redditEvidence.facts || []).join("\n"), /2025-07-21T05:10:24\+00:00|\[deleted\]|5 points|79% upvoted|foil skip|red seal king of hearts|Crimson Heart|The Plant|around 24 rerolls|forgot exact number|感谢|没有新增路线节点|Antimatter|Perkeo|Observatory/i);

const redditQueueItem = (siteData.reviewQueue || []).find((item) => item.id === "reddit-1ja54yd6-replay");
assert.ok(redditQueueItem, "1JA54YD6 should stay in the replay queue for exact shop/reroll validation");
assert.ok(redditQueueItem.targetSeeds?.includes("1JA54YD6"));
assert.match(redditQueueItem.blocker || "", /command-line direct Reddit JSON|Jina|old\.reddit|comments|评论|approximate|精确商店/i);
assert.match(redditQueueItem.nextAction || "", /around 24|forgot exact number|6-7|around 12|5 rerolls|评论|not route|实机复盘/i);

const redditNaneinfSeed = seedById.get("2NJEYMUI");
assert.ok(redditNaneinfSeed, "2NJEYMUI should be promoted from the Reddit naneinf guide into the seed database");
assert.ok(redditNaneinfSeed.sources?.includes("reddit-2njeymui-naneinf-guide"));
assert.match(redditNaneinfSeed.summary || "", /Blueprint|Hanging Chad|Triboulet|Baron|Mime|naneinf/i);

const redditNaneinfDetail = routeData.seedDetails?.["2NJEYMUI"];
assert.ok(redditNaneinfDetail, "2NJEYMUI should have a route detail");
assert.match(redditNaneinfDetail.completeness || "", /Reddit|candidate|待复盘/i);
assert.ok((redditNaneinfDetail.flow || []).length >= 12, "2NJEYMUI should expose source metadata, staged route nodes, and uncertainty boundaries");
assert.match(redditNaneinfDetail.sourceMode || "", /old\.reddit HTML|command-line direct Reddit JSON|Jina|blocked|canonical/i);
const redditNaneinfText = [
  ...(redditNaneinfDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(redditNaneinfDetail.mistakes || [])
]
  .join("\n");
for (const requiredText of [
  "Plasma",
  "Blueprint",
  "Hanging Chad",
  "Triboulet",
  "Deja Vu",
  "Baron",
  "Mime",
  "Antimatter",
  "DNA",
  "Burglar",
  "Serpent"
]) {
  assert.match(redditNaneinfText, new RegExp(requiredText, "i"), `2NJEYMUI route should include ${requiredText}`);
}
for (const requiredText of [
  "First naneinf seed",
  "three_the_3rd",
  "2025-09-19T21:47:57\\+00:00",
  "11 points",
  "87% upvoted",
  "White stake",
  "Tarot Merchant",
  "stay above \\$25",
  "Hieroglyph",
  "Petroglyph",
  "King of Spades",
  "King of Hearts",
  "Baron is one reroll behind",
  "Verdant Leaf",
  "Not sure how Invis rng works",
  "usually copied blueprint",
  "not always",
  "3 total copying jokers",
  "Ectoplasm",
  "same shop you get the ecto",
  "Cola",
  "2 voucher tags",
  "miss Blank",
  "restart",
  "2-3 Blueprints",
  "1-2 Brainstorms",
  "~\\$1800",
  "~35 rerolls",
  "~\\$800-1000",
  "exactly 20 hands",
  "Ante 30",
  "didn't keep super detailed notes",
  "exact antes/shops may be off",
  "comments.*2NJEYMUI|评论.*2NJEYMUI",
  "spoiler.*story|剧透.*剧情",
  "没有新增路线节点|does not add route nodes"
]) {
  assert.match(redditNaneinfText, new RegExp(requiredText, "i"), `2NJEYMUI route should include ${requiredText}`);
}

assert.equal(
  sourceMap["reddit-2njeymui-naneinf-guide"]?.url,
  "https://www.reddit.com/r/Balatro_Seeds/comments/1nlghbk/first_naneinf_seed_ive_found_naturally_2njeymui/"
);

const redditNaneinfEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-2njeymui-naneinf-guide");
assert.ok(redditNaneinfEvidence, "2NJEYMUI should have an evidence card");
assert.ok(redditNaneinfEvidence.seeds?.includes("2NJEYMUI"));
assert.ok((redditNaneinfEvidence.facts || []).length >= 13, "2NJEYMUI evidence should preserve source metadata, route facts, comment status, and uncertainty boundaries");
assert.match(redditNaneinfEvidence.contentType || "", /old\.reddit HTML|command-line direct Reddit JSON|Jina|blocked|评论/i);
assert.match((redditNaneinfEvidence.facts || []).join("\n"), /three_the_3rd|2025-09-19T21:47:57\+00:00|11 points|87% upvoted|Tarot Merchant|stay above \$25|Not sure how Invis rng works|Blank|restart|~\$1800|~35 rerolls|exactly 20 hands|Ante 30|super detailed notes|comments|没有新增路线节点/i);

const redditNaneinfQueueItem = (siteData.reviewQueue || []).find((item) => item.id === "reddit-2njeymui-replay");
assert.ok(redditNaneinfQueueItem, "2NJEYMUI should stay in the replay queue for exact shop/reroll validation");
assert.ok(redditNaneinfQueueItem.targetSeeds?.includes("2NJEYMUI"));
assert.match(redditNaneinfQueueItem.blocker || "", /super detailed notes|exact antes\/shops may be off|comments|old\.reddit|Jina|JSON/i);
assert.match(redditNaneinfQueueItem.nextAction || "", /Invis rng|same shop.*ecto|Cola|Blank|~35|~\$1800|~\$800-1000|exactly 20 hands|Ante 30|评论/i);

const dualSourceSeed = seedById.get("PWX3AQJ8");
assert.ok(dualSourceSeed, "PWX3AQJ8 should be promoted from Reddit + BalatroSeeds evidence into the seed database");
assert.ok(dualSourceSeed.sources?.includes("balatroseeds-pwx3aqj8-ghost"));
assert.ok(dualSourceSeed.sources?.includes("reddit-pwx3aqj8-easiest-nan"));
assert.match(dualSourceSeed.summary || "", /Ghost Deck|Perkeo|Baron|Mime|Blueprint|Brainstorm/i);

const dualSourceDetail = routeData.seedDetails?.PWX3AQJ8;
assert.ok(dualSourceDetail, "PWX3AQJ8 should have a route detail");
assert.match(dualSourceDetail.completeness || "", /双来源|待复盘|candidate/i);
assert.ok((dualSourceDetail.flow || []).length >= 10, "PWX3AQJ8 should expose dual-source route nodes, source metadata, comment strategy, and uncertainty notes");
assert.match(dualSourceDetail.sourceMode || "", /BalatroSeeds|Jina|old\.reddit|command-line direct Reddit JSON|Jina.*403|blocked/i);
const dualSourceText = [
  ...(dualSourceDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(dualSourceDetail.mistakes || [])
]
  .join("\n");
for (const requiredText of [
  "Ghost Deck",
  "Charm Tag",
  "Perkeo",
  "Temperance",
  "Rare Tag",
  "Baron",
  "Judgement",
  "Mime",
  "Reserved Parking",
  "Brainstorm",
  "Blueprint",
  "Invisible Joker",
  "Ectoplasm",
  "Cryptid"
]) {
  assert.match(dualSourceText, new RegExp(requiredText, "i"), `PWX3AQJ8 route should include ${requiredText}`);
}
for (const requiredText of [
  "Balatro Seed: PWX3AQJ8",
  "Version: 1\\.0\\.1n-FULL",
  "Blueberry-diel",
  "2026-02-25T19:08:08\\+00:00",
  "138 points",
  "99% upvoted",
  "200 steel kings",
  "less than 100",
  "3 brainstorms and no blueprints",
  "never found.*neg reserved parking|never found that neg reserved parking",
  "early showman",
  "second Baron",
  "second Mime",
  "ante 7",
  "copy your red seal steel king",
  "50 or so times",
  "middle of a round",
  "using it outside of the round defeats the purpose",
  "45-50 cryptid",
  "Blueprint came fairly late",
  "multiple invis",
  "natural negative Reserved Parking",
  "Rerolled.*2x|2x.*negative reserved",
  "comments.*冲突|冲突.*comments|comment conflict"
]) {
  assert.match(dualSourceText, new RegExp(requiredText, "i"), `PWX3AQJ8 route should include ${requiredText}`);
}

assert.equal(
  sourceMap["balatroseeds-pwx3aqj8-ghost"]?.url,
  "https://balatroseeds.com/seeds/PWX3AQJ8/ghost-deck"
);
assert.equal(
  sourceMap["reddit-pwx3aqj8-easiest-nan"]?.url,
  "https://www.reddit.com/r/Balatro_Seeds/comments/1remlsq/easiest_nan_seed_pwx3aqj8/"
);

const dualSourceEvidence = (siteData.evidenceSources || []).find((item) => item.id === "balatroseeds-pwx3aqj8-ghost");
assert.ok(dualSourceEvidence, "PWX3AQJ8 should have a BalatroSeeds evidence card");
assert.ok(dualSourceEvidence.seeds?.includes("PWX3AQJ8"));
assert.ok((dualSourceEvidence.facts || []).length >= 7, "PWX3AQJ8 BalatroSeeds evidence should preserve source-backed component facts");
assert.match((dualSourceEvidence.facts || []).join("\n"), /Balatro Seed: PWX3AQJ8|Ghost Deck|Version: 1\.0\.1n-FULL|Perkeo|Baron|Mime|natural negative Reserved Parking|Invisible Joker copies Blueprint|Ectoplasm/i);

const redditDualSourceEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-pwx3aqj8-easiest-nan");
assert.ok(redditDualSourceEvidence, "PWX3AQJ8 should have a Reddit evidence card");
assert.ok(redditDualSourceEvidence.seeds?.includes("PWX3AQJ8"));
assert.ok((redditDualSourceEvidence.facts || []).length >= 10, "PWX3AQJ8 Reddit evidence should preserve route, metadata, comment strategy, and conflict facts");
assert.match(redditDualSourceEvidence.contentType || "", /old\.reddit HTML|command-line direct Reddit JSON|Jina|blocked|评论/i);
assert.match((redditDualSourceEvidence.facts || []).join("\n"), /Blueberry-diel|2026-02-25T19:08:08\+00:00|138 points|99% upvoted|Charm Tag|Rare Tag|Judgement|200 steel kings|45-50|middle of a round|outside of the round defeats the purpose|second Baron|second Mime|Blueprint came fairly late|natural negative Reserved Parking|Rerolled.*2x/i);

const dualSourceQueueItem = (siteData.reviewQueue || []).find((item) => item.id === "pwx3aqj8-dual-source-replay");
assert.ok(dualSourceQueueItem, "PWX3AQJ8 should stay in the replay queue for exact shop/pack validation");
assert.ok(dualSourceQueueItem.targetSeeds?.includes("PWX3AQJ8"));
assert.match(dualSourceQueueItem.nextAction || "", /45-50|middle of a round|200 steel kings|Showman|second Baron|second Mime|Blueprint|Invisible|Reserved Parking|2x|实机复盘/i);

const communityNaneinfSeed = seedById.get("TR6AH4P3");
assert.ok(communityNaneinfSeed, "TR6AH4P3 should be promoted from Reddit + The Soul evidence into the seed database");
assert.ok(communityNaneinfSeed.sources?.includes("reddit-tr6ah4p3-perfect-naneinf"));
assert.ok(communityNaneinfSeed.sources?.includes("thesoul-tr6ah4p3-analyzer"));
assert.match(communityNaneinfSeed.summary || "", /Plasma|Blueprint|Mime|DNA|Burglar|Serpent|naneinf/i);

const communityNaneinfDetail = routeData.seedDetails?.TR6AH4P3;
assert.ok(communityNaneinfDetail, "TR6AH4P3 should have a route detail");
assert.match(communityNaneinfDetail.completeness || "", /Reddit|The Soul|candidate|待复盘/i);
assert.ok((communityNaneinfDetail.flow || []).length >= 11, "TR6AH4P3 should expose Reddit guide stages and analyzer caveats");
const communityNaneinfText = [
  ...(communityNaneinfDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(communityNaneinfDetail.queueTables || []).flatMap((table) => [
    table.boss,
    table.voucher,
    ...(table.tags || []),
    ...(table.shopQueue || []),
    ...(table.packs || [])
  ])
].join("\n");
for (const requiredText of [
  "Plasma",
  "Judgement",
  "To-Do List",
  "Midas Mask",
  "Blueprint",
  "Mime",
  "Brainstorm",
  "Negative DNA",
  "Sixth Sense",
  "Ectoplasm",
  "Burglar",
  "Reserved Parking",
  "Serpent",
  "44 red steel kings"
]) {
  assert.match(communityNaneinfText, new RegExp(requiredText, "i"), `TR6AH4P3 route should include ${requiredText}`);
}

assert.equal(
  sourceMap["reddit-tr6ah4p3-perfect-naneinf"]?.url,
  "https://www.reddit.com/r/Balatro_Seeds/comments/1ogm33m/i_think_ive_found_the_perfect_naneinf_seed_this/"
);
assert.equal(
  sourceMap["thesoul-tr6ah4p3-analyzer"]?.url,
  "https://spectralpack.github.io/TheSoul/"
);

const communityNaneinfEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-tr6ah4p3-perfect-naneinf");
assert.ok(communityNaneinfEvidence, "TR6AH4P3 should have a Reddit evidence card");
assert.ok(communityNaneinfEvidence.seeds?.includes("TR6AH4P3"));
assert.ok((communityNaneinfEvidence.facts || []).length >= 8, "TR6AH4P3 Reddit evidence should preserve the source-backed guide facts");

const communityNaneinfAnalyzerEvidence = (siteData.evidenceSources || []).find((item) => item.id === "thesoul-tr6ah4p3-analyzer");
assert.ok(communityNaneinfAnalyzerEvidence, "TR6AH4P3 should have a The Soul analyzer evidence card");
assert.ok(communityNaneinfAnalyzerEvidence.seeds?.includes("TR6AH4P3"));
assert.ok((communityNaneinfAnalyzerEvidence.facts || []).length >= 5, "TR6AH4P3 analyzer evidence should preserve reproducible queue facts");

const communityNaneinfQueueItem = (siteData.reviewQueue || []).find((item) => item.id === "reddit-tr6ah4p3-replay");
assert.ok(communityNaneinfQueueItem, "TR6AH4P3 should stay in the replay queue for exact reroll and boss validation");
assert.ok(communityNaneinfQueueItem.targetSeeds?.includes("TR6AH4P3"));

const ghostNaneinfSeed = seedById.get("8Q47WV6K");
assert.ok(ghostNaneinfSeed, "8Q47WV6K should remain in the seed database");
assert.ok(ghostNaneinfSeed.sources?.includes("balatroseeds-8q47wv6k-ghost"));
assert.ok(ghostNaneinfSeed.sources?.includes("reddit-8q47wv6k-insane-seed"));
assert.match(ghostNaneinfSeed.summary || "", /Ghost Deck|Triboulet|Perkeo|Blueprint|Brainstorm|Baron|Mime|naneinf/i);

const ghostNaneinfDetail = routeData.seedDetails?.["8Q47WV6K"];
assert.ok(ghostNaneinfDetail, "8Q47WV6K should have an upgraded route detail");
assert.match(ghostNaneinfDetail.completeness || "", /双来源|BalatroSeeds|Reddit|candidate|待复盘/i);
assert.ok((ghostNaneinfDetail.flow || []).length >= 8, "8Q47WV6K should expose dual-source route stages and risk notes");
assert.match(ghostNaneinfDetail.sourceMode || "", /old\.reddit HTML|command-line direct Reddit JSON|network security|BalatroSeeds|Jina/i);
const ghostNaneinfText = [
  ...(ghostNaneinfDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(ghostNaneinfDetail.mistakes || [])
].join("\n");
for (const requiredText of [
  "Ghost Deck",
  "double tag",
  "mega arcana pack",
  "Triboulet",
  "Perkeo",
  "Temperance",
  "Death",
  "Ectoplasm",
  "Deja Vu",
  "Cryptid",
  "Mime",
  "Brainstorm",
  "Baron",
  "Showman",
  "Sock and Buskin",
  "DNA",
  "red seal steel kings"
]) {
  assert.match(ghostNaneinfText, new RegExp(requiredText, "i"), `8Q47WV6K route should include ${requiredText}`);
}
for (const requiredText of [
  "LEMO2000",
  "2024-05-06T21:55:43\\+00:00",
  "820 points",
  "99% upvoted",
  "2\\^15",
  "2\\^20",
  "2\\^25",
  "10\\^14",
  "10\\^17",
  "e21",
  "e23",
  "e24",
  "e86",
  "e115",
  "e213",
  "~22 cryptids|22 cryptids",
  "copying 4 Cryptids per round",
  "464 cards",
  "hand.*capped.*6|capped.*6",
  "Cerulean Bell",
  "Antimatter",
  "Cola",
  "Observatory",
  "Eris",
  "600 Plutos|1700",
  "console|Switch|white stack|Canio|Caino",
  "comment.*branch|评论.*分支|comment conflict"
]) {
  assert.match(ghostNaneinfText, new RegExp(requiredText, "i"), `8Q47WV6K route should include ${requiredText}`);
}

assert.equal(
  sourceMap["reddit-8q47wv6k-insane-seed"]?.url,
  "https://www.reddit.com/r/balatro/comments/1clvbv1/stumbled_across_an_insane_seed/"
);

const ghostRedditEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-8q47wv6k-insane-seed");
assert.ok(ghostRedditEvidence, "8Q47WV6K should have a Reddit evidence card");
assert.ok(ghostRedditEvidence.seeds?.includes("8Q47WV6K"));
assert.ok((ghostRedditEvidence.facts || []).length >= 14, "8Q47WV6K Reddit evidence should preserve source-backed route, metadata, score math, comment branches, and risk facts");
assert.match(ghostRedditEvidence.contentType || "", /old\.reddit HTML|command-line direct Reddit JSON|network security|评论/i);
assert.match((ghostRedditEvidence.facts || []).join("\n"), /LEMO2000|2024-05-06T21:55:43\+00:00|820 points|99% upvoted|double tag|mega arcana pack|2\^15|2\^20|2\^25|10\^14|10\^17|e21|e23|e86|~22 cryptids|Cerulean Bell|Antimatter|Observatory|Eris|Switch|Canio|464 cards/i);

const ghostReplayItem = (siteData.reviewQueue || []).find((item) => item.id === "reddit-8q47wv6k-replay");
assert.ok(ghostReplayItem, "8Q47WV6K should have a dedicated replay queue item");
assert.ok(ghostReplayItem.targetSeeds?.includes("8Q47WV6K"));
assert.match(ghostReplayItem.nextAction || "", /LEMO2000|2\^15|2\^20|2\^25|~22 cryptids|Antimatter|Cola|Cerulean Bell|Observatory|Eris|Switch|Canio|464 cards|实机复盘/i);

const yellowDeckSteelCandidate = seedById.get("HNITC7EL");
assert.ok(yellowDeckSteelCandidate, "HNITC7EL should remain in the seed database");
assert.ok(yellowDeckSteelCandidate.sources?.includes("balatroseeds-hnitc7el"));
assert.match(yellowDeckSteelCandidate.summary || "", /Yellow Deck|Blueprint|Ankh|DNA|Hanging Chad|Photograph|red seal|glass King/i);

const yellowDeckDetail = routeData.seedDetails?.HNITC7EL;
assert.ok(yellowDeckDetail, "HNITC7EL should have an upgraded route detail");
assert.match(yellowDeckDetail.completeness || "", /BalatroSeeds|Version 1\.0\.1n-FULL|待复盘/i);
assert.ok((yellowDeckDetail.flow || []).length >= 6, "HNITC7EL should split the BalatroSeeds notes into staged playable nodes");
const yellowDeckText = [
  ...(yellowDeckDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(yellowDeckDetail.mistakes || [])
].join("\n");
for (const requiredText of [
  "Yellow Deck",
  "1.0.1n-FULL",
  "Blueprint",
  "Vagabond",
  "Temperance",
  "Paint Brush",
  "two pair",
  "Wheel tarot",
  "Ankh",
  "DNA",
  "Hanging Chad",
  "Photograph",
  "red seal",
  "glass King",
  "negative Baron"
]) {
  assert.match(yellowDeckText, new RegExp(requiredText, "i"), `HNITC7EL route should include ${requiredText}`);
}

assert.equal(
  sourceMap["balatroseeds-hnitc7el"]?.url,
  "https://balatroseeds.com/seeds/HNITC7EL/yellow-deck"
);

const yellowDeckEvidence = (siteData.evidenceSources || []).find((item) => item.id === "balatroseeds-hnitc7el-steel-k");
assert.ok(yellowDeckEvidence, "HNITC7EL should have a BalatroSeeds evidence card");
assert.ok(yellowDeckEvidence.seeds?.includes("HNITC7EL"));
assert.match(yellowDeckEvidence.url || "", /\/HNITC7EL\/yellow-deck$/);
assert.ok((yellowDeckEvidence.facts || []).length >= 7, "HNITC7EL evidence should preserve source-backed stage facts and caveats");

const englishRefreshQueue = (siteData.reviewQueue || []).find((item) => item.id === "english-seed-bank-refresh");
assert.ok(englishRefreshQueue, "HNITC7EL should stay in the English seed bank refresh queue");
assert.ok(englishRefreshQueue.targetSeeds?.includes("HNITC7EL"));
assert.match(englishRefreshQueue.nextAction || "", /HNITC7EL|negative Baron|red seal|glass King|Blueprint/i);

const fastSteelKDetail = routeData.seedDetails?.["9OUU79"];
assert.ok(fastSteelKDetail, "9OUU79 should keep a Bilibili route detail");
assert.match(fastSteelKDetail.sourceMode || "", /评论 API|player\/v2|置顶攻略图|人工复盘/);
assert.match(fastSteelKDetail.videoStatus || "", /subtitles|view_points|无公开字幕|无章节|yt-dlp.*412/i);
assert.ok((fastSteelKDetail.flow || []).length >= 8, "9OUU79 should expose pinned-guide round-by-round route stages beyond summary nodes");
assert.ok((fastSteelKDetail.evidenceImages || []).length >= 1, "9OUU79 should expose the pinned Bilibili route image");
const fastSteelKText = [
  ...(fastSteelKDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(fastSteelKDetail.mistakes || []),
  ...(fastSteelKDetail.evidenceImages || []).flatMap((image) => [image.label, image.note, image.url])
].join("\n");
for (const requiredText of [
  "258851541904",
  "88c43f38b4a62a04bfb842e7717ecca951544122",
  "6底注16回合爆机攻略",
  "257583350320",
  "草莓香蕉西瓜菠萝",
  "2-1.*蓝图",
  "3-2.*通灵",
  "4-1.*隐形小丑",
  "5-1.*战车",
  "5-1.*男爵",
  "≤\\s*54",
  "普通K",
  "1底注1回合.*同花方块A\\s*Q\\s*J\\s*8\\s*6",
  "超级秘术包.*幻灵.*负片帕奇欧.*节制",
  "2底注3回合.*DNA.*海王星",
  "2底注4回合.*蓝图.*愚者.*节制",
  "3底注6回合.*头脑风暴",
  "3底注8回合.*通灵",
  "4底注10回合.*DNA.*最左",
  "5底注12回合.*证书.*战车",
  "5底注13回合.*红色蜡封.*钢铁牌.*男爵",
  "5底注14回合.*死神.*马戏团长",
  "6底注16回合.*25张.*幻灵神秘生物.*naneinf",
  "OCR.*低置信|人工视检",
  "无公开字幕",
  "无章节"
]) {
  assert.match(fastSteelKText, new RegExp(requiredText, "i"), `9OUU79 route provenance should include ${requiredText}`);
}

const fastSteelKEvidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-9ouu79");
assert.ok(fastSteelKEvidence, "9OUU79 should have a Bilibili evidence card");
assert.ok(fastSteelKEvidence.seeds?.includes("9OUU79"));
assert.ok((fastSteelKEvidence.facts || []).length >= 14, "9OUU79 evidence should preserve API, player/v2, comment, image, and pinned-guide round facts");
assert.match(fastSteelKEvidence.contentType || "", /API|评论|player\/v2|置顶攻略图|人工视检/);
assert.match((fastSteelKEvidence.facts || []).join("\n"), /258851541904|574\s*x\s*10799|subtitles|view_points|257583350320|1-1|2-3.*DNA|5-13.*红色蜡封|6-16.*25.*Cryptid|≤\s*54|yt-dlp.*412/i);

const yushenSteelKDetail = routeData.seedDetails?.["90UU79"];
assert.ok(yushenSteelKDetail, "90UU79 should keep a Bilibili route detail");
assert.match(yushenSteelKDetail.sourceMode || "", /评论 API|player\/v2|分 P/);
assert.match(yushenSteelKDetail.videoStatus || "", /113639247843300|subtitles|view_points|无公开字幕|无章节|yt-dlp.*412/i);
assert.ok((yushenSteelKDetail.flow || []).length >= 8, "90UU79 should expose long-image route stages beyond part-title summary nodes");
assert.ok((yushenSteelKDetail.evidenceImages || []).length >= 1, "90UU79 should expose the high-like Bilibili route image");
const yushenSteelKText = [
  ...(yushenSteelKDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(yushenSteelKDetail.mistakes || []),
  ...(yushenSteelKDetail.evidenceImages || []).flatMap((image) => [image.label, image.note, image.url])
].join("\n");
for (const requiredText of [
  "雨神の右手",
  "1733998272",
  "27303020224",
  "27303347473",
  "27303741163",
  "27304132834",
  "27370129562",
  "27422361046",
  "17注的蓝图",
  "20注负片DNA",
  "负片信封",
  "男爵比哑剧多一张",
  "天晴雨_",
  "252812449120",
  "841459d0038aa7c591778636582828f1500494216",
  "1002\\s*x\\s*20987",
  "超级秘术包.*传奇小丑.*节制",
  "重置商店两下.*蓝图.*头脑风暴",
  "冰淇淋.*巨型秘术包.*愚者",
  "七次商店.*死神",
  "通灵.*第一位.*A\\s*K\\s*Q\\s*J\\s*10",
  "蓝色小丑.*葫芦牌型",
  "证书.*第一位",
  "红签黑桃K.*死神.*三张",
  "战车.*钢铁.*黑桃.*红签K",
  "17.*商店找蓝图",
  "模糊小丑.*可乐.*复制标签",
  "负片DNA",
  "不是很准确|灵活变通",
  "不是游戏版本号",
  "无公开字幕",
  "无章节"
]) {
  assert.match(yushenSteelKText, new RegExp(requiredText, "i"), `90UU79 route provenance should include ${requiredText}`);
}

const yushenSteelKEvidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-90uu79-yushen");
assert.ok(yushenSteelKEvidence, "90UU79 should have a Bilibili evidence card");
assert.ok(yushenSteelKEvidence.seeds?.includes("90UU79"));
assert.ok((yushenSteelKEvidence.facts || []).length >= 15, "90UU79 evidence should preserve API, player/v2, comments, route image, and uncertainty facts");
assert.match(yushenSteelKEvidence.contentType || "", /API|评论|player\/v2|分 P/);
assert.match((yushenSteelKEvidence.facts || []).join("\n"), /113639247843300|BV1ysq8YZExk|subtitles|view_points|天晴雨_|252812449120|1002\s*x\s*20987|1.*超级秘术包|13.*红签黑桃K|17.*蓝图|20注负片DNA|男爵比哑剧多一张/i);

const chineseReplayDeepReview = (siteData.reviewQueue || []).find((item) => item.id === "bili-9ouu79-replay");
assert.ok(chineseReplayDeepReview, "9OUU79/90UU79 should remain in the deep review queue");
assert.match(chineseReplayDeepReview.nextAction || "", /9OUU79|90UU79|258851541904|252812449120|17注的蓝图|20注负片DNA|无公开字幕|view_points/);

const chineseSteelKSeed = seedById.get("9ZPU1V32");
assert.ok(chineseSteelKSeed, "9ZPU1V32 should be promoted from Chinese video/community sources into the seed database");
assert.ok(chineseSteelKSeed.sources?.includes("bili-9zpu1v32-full-flow"));
assert.ok(chineseSteelKSeed.sources?.includes("douyu-9zpu1v32-summary"));
assert.ok(chineseSteelKSeed.sources?.includes("balatroseed-9zpu1v32-index"));
assert.match(chineseSteelKSeed.summary || "", /Plasma|等离子|Baron|男爵|Mime|哑剧|Perkeo|佩尔|naneinf/i);

const chineseSteelKDetail = routeData.seedDetails?.["9ZPU1V32"];
assert.ok(chineseSteelKDetail, "9ZPU1V32 should have a route detail");
assert.match(chineseSteelKDetail.completeness || "", /B站|斗鱼|BalatroSeed|candidate|待复盘/i);
assert.ok((chineseSteelKDetail.flow || []).length >= 11, "9ZPU1V32 should expose Chinese full-flow route stages and uncertainty notes");
const chineseSteelKText = [
  ...(chineseSteelKDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(chineseSteelKDetail.mistakes || [])
]
  .join("\n");
for (const requiredText of [
  "Plasma",
  "等离子",
  "Baron",
  "男爵",
  "red seal",
  "红蜡",
  "steel K",
  "钢铁K",
  "Perkeo",
  "佩尔科欧",
  "Blueprint",
  "蓝图",
  "Brainstorm",
  "头脑风暴",
  "Mime",
  "哑剧",
  "Death",
  "死神",
  "Cryptid",
  "通灵",
  "Ectoplasm",
  "灵质",
  "Invisible Joker",
  "隐形小丑",
  "naneinf",
  "39注"
]) {
  assert.match(chineseSteelKText, new RegExp(requiredText, "i"), `9ZPU1V32 route should include ${requiredText}`);
}
for (const requiredText of [
  "17\\s*个分\\s*P",
  "subtitles",
  "view_points",
  "无公开字幕",
  "无章节",
  "feed_id",
  "2493715042218933363",
  "Seronda",
  "灵质最多开三次",
  "第四张灵质",
  "38\\s*注",
  "e300",
  "nan",
  "-3\\s*手牌",
  "吟游诗人",
  "\\+2\\s*手牌",
  "11-31",
  "7\\s*注.*审判",
  "复制数量",
  "BalatroSeed.*摘要"
]) {
  assert.match(chineseSteelKText, new RegExp(requiredText, "i"), `9ZPU1V32 provenance/conflict route should include ${requiredText}`);
}
assert.ok(
  (chineseSteelKDetail.queueTables || []).length >= 10,
  "9ZPU1V32 should expose structured source-backed route tables, not only prose flow nodes"
);
const chineseSteelKQueueText = (chineseSteelKDetail.queueTables || [])
  .flatMap((table) => [
    table.ante,
    table.title,
    table.boss,
    table.voucher,
    table.routeUse,
    ...(table.tags || []),
    ...(table.shopQueue || []),
    ...(table.packs || [])
  ])
  .join("\n");
for (const requiredText of [
  "前提",
  "1注",
  "1-2.*男爵",
  "2注",
  "2-4.*红蜡封K",
  "3注",
  "3-6.*蓝",
  "3-7.*绿",
  "3-8.*红蜡钢铁K",
  "5-6注",
  "5-12.*死神",
  "5-13.*跳过",
  "6-16.*通灵.*神秘生物.*灵质",
  "7-8注",
  "8注.*全黑桃K红蜡钢铁牌",
  "9-11注",
  "11-29.*头脑风暴",
  "11-31.*哑剧",
  "12.*19次",
  "负片马戏团长",
  "13.*20.*负片标签",
  "38.*e300",
  "39.*nan",
  "5男爵3哑剧",
  "6张复制",
  "4手牌上限",
  "roll|重掷",
  "现金阈值",
  "Boss",
  "Joker位",
  "隐形小丑复制目标",
  "逐帧.*待复盘|待复盘.*逐帧",
  "BalatroSeed.*只提供摘要"
]) {
  assert.match(chineseSteelKQueueText, new RegExp(requiredText, "i"), `9ZPU1V32 structured route table should include ${requiredText}`);
}
assert.doesNotMatch(
  `${chineseSteelKDetail.completeness}\n${chineseSteelKQueueText}`,
  /完整逐帧|完整逐店|可复现完整攻略/,
  "9ZPU1V32 should not be upgraded beyond source-backed candidate tables without video replay"
);

assert.equal(
  sourceMap["bili-9zpu1v32-full-flow"]?.url,
  "https://www.bilibili.com/video/BV1nz42197qg/"
);
assert.equal(
  sourceMap["douyu-9zpu1v32-summary"]?.url,
  "https://yuba.douyu.com/p/184637701710348259"
);
assert.equal(
  sourceMap["balatroseed-9zpu1v32-index"]?.url,
  "https://balatroseed.net/zh/seeds/18"
);

const chineseSteelKEvidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-9zpu1v32-full-flow");
assert.ok(chineseSteelKEvidence, "9ZPU1V32 should have a Bilibili evidence card");
assert.ok(chineseSteelKEvidence.seeds?.includes("9ZPU1V32"));
assert.ok((chineseSteelKEvidence.facts || []).length >= 7, "9ZPU1V32 Bilibili evidence should preserve source-backed full-flow facts");
assert.ok((chineseSteelKEvidence.facts || []).length >= 10, "9ZPU1V32 Bilibili evidence should preserve 17P, subtitle, chapter, and comment facts");
assert.match(chineseSteelKEvidence.contentType || "", /API|Jina|评论|字幕|章节/);
assert.match((chineseSteelKEvidence.facts || []).join("\n"), /17\s*个分\s*P|subtitles|view_points|1-2\s*男爵|11-31\s*哑剧|38\s*注|nan/i);

const chineseSteelKCommunityEvidence = (siteData.evidenceSources || []).find((item) => item.id === "douyu-9zpu1v32-summary");
assert.ok(chineseSteelKCommunityEvidence, "9ZPU1V32 should have a Douyu community evidence card");
assert.ok(chineseSteelKCommunityEvidence.seeds?.includes("9ZPU1V32"));
assert.ok((chineseSteelKCommunityEvidence.facts || []).length >= 7, "9ZPU1V32 Douyu evidence should preserve source-backed community route facts");
assert.ok((chineseSteelKCommunityEvidence.facts || []).length >= 10, "9ZPU1V32 Douyu evidence should preserve feed mapping, Seance, Ectoplasm, and negative-tag facts");
assert.match((chineseSteelKCommunityEvidence.facts || []).join("\n"), /feed_id|2493715042218933363|Seronda|灵质最多开三次|第四张灵质|底注13|底注20|吟游诗人|\+2\s*手牌/);

const chineseSteelKIndexEvidence = (siteData.evidenceSources || []).find((item) => item.id === "balatroseed-9zpu1v32-index");
assert.ok(chineseSteelKIndexEvidence, "9ZPU1V32 should have a BalatroSeed index evidence card");
assert.ok(chineseSteelKIndexEvidence.seeds?.includes("9ZPU1V32"));
assert.match((chineseSteelKIndexEvidence.facts || []).join("\n"), /只提供摘要|不提供.*流程|不提供.*牌组|不提供.*版本/);

const chineseSteelKReplayItem = (siteData.reviewQueue || []).find((item) => item.id === "bili-9zpu1v32-replay");
assert.ok(chineseSteelKReplayItem, "9ZPU1V32 should stay in the replay queue for exact shop/reroll validation");
assert.ok(chineseSteelKReplayItem.targetSeeds?.includes("9ZPU1V32"));
assert.match(chineseSteelKReplayItem.nextAction || "", /17P|无公开字幕|view_points|feed_id|哑剧时点|复制数量|灵质三次/);

const taptapSteelKSeed = seedById.get("X8WTK1U1");
assert.ok(taptapSteelKSeed, "X8WTK1U1 should remain in the seed database");
assert.ok(taptapSteelKSeed.sources?.includes("taptap-x8wtk1u1"));
assert.match(taptapSteelKSeed.summary || "", /TapTap|10回合镭射钢K|1-7|回合\s*8-10|标题待补/i);

const taptapSteelKDetail = routeData.seedDetails?.X8WTK1U1;
assert.ok(taptapSteelKDetail, "X8WTK1U1 should have a TapTap route detail");
assert.match(taptapSteelKDetail.completeness || "", /1-7|10回合标题待补|回合\s*8-10/i);
assert.match(taptapSteelKDetail.sourceMode || "", /Jina Reader|原始 HTML|图片链接|评论正文未展开/i);
assert.match(taptapSteelKDetail.videoStatus || "", /非视频|评论\s*2|评论正文不可读|标题.*10回合/i);
assert.ok((taptapSteelKDetail.flow || []).length >= 6, "X8WTK1U1 should split source metadata, exact early flow, and missing late flow");
assert.ok((taptapSteelKDetail.evidenceImages || []).length >= 1, "X8WTK1U1 should expose the TapTap image evidence link");
const taptapSteelKText = [
  ...(taptapSteelKDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(taptapSteelKDetail.mistakes || []),
  ...(taptapSteelKDetail.evidenceImages || []).flatMap((image) => [image.label, image.note, image.url])
].join("\n");
for (const requiredText of [
  "可爱的羊八鲁",
  "2025-06-22T03:25:58\\+00:00",
  "969 浏览",
  "10回合镭射钢K",
  "后面啥样子我都不敢想",
  "红桃 8910jq",
  "给负片",
  "黑桃K给钢铁效果",
  "红戳（核心，需保留）",
  "三张红戳",
  "回合7卡包",
  "想创造极限就做笔记",
  "错了就重开",
  "试错的机会是无限的",
  "回合 8-10",
  "Fon5JneJXUcHBe6QcJ0j7GWYihZc"
]) {
  assert.match(taptapSteelKText, new RegExp(requiredText, "i"), `X8WTK1U1 TapTap route should include ${requiredText}`);
}

assert.equal(
  sourceMap["taptap-x8wtk1u1"]?.url,
  "https://www.taptap.cn/moment/685810471831342883"
);

const taptapSteelKEvidence = (siteData.evidenceSources || []).find((item) => item.id === "taptap-x8wtk1u1");
assert.ok(taptapSteelKEvidence, "X8WTK1U1 should have a TapTap evidence card");
assert.ok(taptapSteelKEvidence.seeds?.includes("X8WTK1U1"));
assert.ok((taptapSteelKEvidence.facts || []).length >= 8, "X8WTK1U1 evidence should preserve source metadata, image link, exact flow, and missing late-flow boundary");
assert.match(taptapSteelKEvidence.contentType || "", /Jina Reader|原始 HTML|图片|评论状态/i);
assert.match((taptapSteelKEvidence.facts || []).join("\n"), /可爱的羊八鲁|2025-06-22T03:25:58\+00:00|969 浏览|评论 2|给负片|回合7卡包|图片|回合 8-10|评论正文/i);

const taptapSteelKQueue = (siteData.reviewQueue || []).find((item) => item.id === "taptap-x8wtk1u1-full-route");
assert.ok(taptapSteelKQueue, "X8WTK1U1 should stay in the replay queue for late-flow validation");
assert.ok(taptapSteelKQueue.targetSeeds?.includes("X8WTK1U1"));
assert.match(taptapSteelKQueue.nextAction || "", /图片|评论\s*2|回合\s*8-10|实机复盘|标题待补/);

const weiboImageSeed = seedById.get("IRW4G69D");
assert.ok(weiboImageSeed, "IRW4G69D should remain in the seed database");
assert.ok(weiboImageSeed.sources?.includes("weibo-irw4g69d-steel-k"));
assert.match(weiboImageSeed.summary || "", /微博|1-1|Blueprint|4-2|Chicot|8\s*底注|Baron|红封\s*K|底注\s*18/i);

const weiboImageDetail = routeData.seedDetails?.IRW4G69D;
assert.ok(weiboImageDetail, "IRW4G69D should have a route detail");
assert.match(weiboImageDetail.completeness || "", /微博|图片|截图|OCR|待复盘/i);
assert.ok((weiboImageDetail.flow || []).length >= 4, "IRW4G69D should split text and image evidence into staged nodes");
assert.ok((weiboImageDetail.evidenceImages || []).length >= 2, "IRW4G69D should expose original Weibo images as evidence links");
const weiboImageText = [
  ...(weiboImageDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(weiboImageDetail.mistakes || []),
  ...(weiboImageDetail.evidenceImages || []).flatMap((image) => [image.label, image.note, image.url])
].join("\n");
for (const requiredText of [
  "Strong_JIA",
  "Wed Dec 24 01:22:46 \\+0800 2025",
  "iPhone客户端",
  "发布于 陕西",
  "comments_count 1|1 条评论|评论 1",
  "attitudes_count 1|1 赞|点赞 1",
  "reposts_count 0|0 转发",
  "评论罗伯特",
  "AI罗伯特聪明版",
  "没有新增路线节点|不提供路线节点",
  "灵媒",
  "红封K",
  "底注 18/8",
  "回合 54",
  "175/198",
  "9/9",
  "12/10",
  "13/10",
  "OCR",
  "商店顺序"
]) {
  assert.match(weiboImageText, new RegExp(requiredText, "i"), `IRW4G69D image evidence should include ${requiredText}`);
}

const weiboImageEvidence = (siteData.evidenceSources || []).find((item) => item.id === "weibo-irw4g69d-steel-k");
assert.ok(weiboImageEvidence, "IRW4G69D should have a Weibo evidence card");
assert.ok(weiboImageEvidence.seeds?.includes("IRW4G69D"));
assert.ok((weiboImageEvidence.facts || []).length >= 11, "IRW4G69D evidence should preserve text facts, Weibo metadata, comments boundary, and image verification facts");
assert.match((weiboImageEvidence.facts || []).join("\n"), /Strong_JIA|Wed Dec 24 01:22:46 \+0800 2025|iPhone客户端|发布于 陕西|1 条评论|1 赞|0 转发|评论罗伯特|AI罗伯特聪明版|没有新增路线节点|配图|灵媒|红封K|底注\s*18\/8|回合\s*54|OCR|商店顺序/i);

const weiboImageQueue = (siteData.reviewQueue || []).find((item) => item.id === "weibo-ocr-seed-post");
assert.ok(weiboImageQueue, "IRW4G69D should stay in the Weibo OCR/replay queue");
assert.ok(weiboImageQueue.targetSeeds?.includes("IRW4G69D"));
assert.match(weiboImageQueue.status || "", /ready-replay|ready-ocr/);
assert.match(weiboImageQueue.nextAction || "", /Strong_JIA|评论罗伯特|截图|红封K|底注 18\/8|商店顺序|实机复盘/);

const xhsStatus = (siteData.platformStatus || []).find((item) => item.platform === "小红书");
assert.ok(xhsStatus, "Xiaohongshu platform status should be tracked");
assert.equal(xhsStatus.usableNow, false);
assert.match([xhsStatus.status, xhsStatus.limitation, xhsStatus.nextAction].join("\n"), /localhost:18060|Failed to create socket directory|ProcessSingleton|profile directory|search_feeds|check_login_status/i);

const xhsRuntimeEvidence = (siteData.evidenceSources || []).find((item) => item.id === "xhs-mcp-login-status");
assert.ok(xhsRuntimeEvidence, "Xiaohongshu runtime status should have an evidence card");
assert.match((xhsRuntimeEvidence.facts || []).join("\n"), /localhost:18060|Failed to create socket directory|ProcessSingleton|profile directory|check_login_status|search_feeds/i);

const xhsQueue = (siteData.reviewQueue || []).find((item) => item.id === "xhs-login-balatro-steel-k");
assert.ok(xhsQueue, "Xiaohongshu replay queue item should remain tracked");
assert.match([xhsQueue.blocker, xhsQueue.nextAction, xhsQueue.validation].join("\n"), /Failed to create socket directory|ProcessSingleton|profile directory|search_feeds|feed id|xsec token/i);

console.log("Route harvest contracts passed");
