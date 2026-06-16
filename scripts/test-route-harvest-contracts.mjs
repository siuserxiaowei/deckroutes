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
assert.ok((redditDetail.flow || []).length >= 8, "1JA54YD6 should expose the Reddit guide as staged route nodes");
const redditRouteText = (redditDetail.flow || [])
  .flatMap((stage) => [stage.stage, ...(stage.actions || [])])
  .join("\n");
for (const requiredText of ["Plasma", "Foil DNA", "red seal", "Stuntman", "Mime", "Brainstorm", "Baron", "Blueprint"]) {
  assert.match(redditRouteText, new RegExp(requiredText, "i"), `1JA54YD6 route should include ${requiredText}`);
}

assert.equal(
  sourceMap["reddit-1ja54yd6-full-guide"]?.url,
  "https://www.reddit.com/r/balatro/comments/1m5a7tq/full_guide_early_foil_dna_stuntman_red_seal_late/"
);

const redditEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-1ja54yd6-full-guide");
assert.ok(redditEvidence, "1JA54YD6 should have an evidence card");
assert.ok(redditEvidence.seeds?.includes("1JA54YD6"));
assert.ok((redditEvidence.facts || []).length >= 6, "1JA54YD6 evidence should preserve source-backed route facts");

const redditQueueItem = (siteData.reviewQueue || []).find((item) => item.id === "reddit-1ja54yd6-replay");
assert.ok(redditQueueItem, "1JA54YD6 should stay in the replay queue for exact shop/reroll validation");
assert.ok(redditQueueItem.targetSeeds?.includes("1JA54YD6"));

const redditNaneinfSeed = seedById.get("2NJEYMUI");
assert.ok(redditNaneinfSeed, "2NJEYMUI should be promoted from the Reddit naneinf guide into the seed database");
assert.ok(redditNaneinfSeed.sources?.includes("reddit-2njeymui-naneinf-guide"));
assert.match(redditNaneinfSeed.summary || "", /Blueprint|Hanging Chad|Triboulet|Baron|Mime|naneinf/i);

const redditNaneinfDetail = routeData.seedDetails?.["2NJEYMUI"];
assert.ok(redditNaneinfDetail, "2NJEYMUI should have a route detail");
assert.match(redditNaneinfDetail.completeness || "", /Reddit|candidate|待复盘/i);
assert.ok((redditNaneinfDetail.flow || []).length >= 9, "2NJEYMUI should expose the Reddit naneinf notes as staged route nodes");
const redditNaneinfText = (redditNaneinfDetail.flow || [])
  .flatMap((stage) => [stage.stage, ...(stage.actions || [])])
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

assert.equal(
  sourceMap["reddit-2njeymui-naneinf-guide"]?.url,
  "https://www.reddit.com/r/Balatro_Seeds/comments/1nlghbk/first_naneinf_seed_ive_found_naturally_2njeymui/"
);

const redditNaneinfEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-2njeymui-naneinf-guide");
assert.ok(redditNaneinfEvidence, "2NJEYMUI should have an evidence card");
assert.ok(redditNaneinfEvidence.seeds?.includes("2NJEYMUI"));
assert.ok((redditNaneinfEvidence.facts || []).length >= 7, "2NJEYMUI evidence should preserve source-backed route facts");

const redditNaneinfQueueItem = (siteData.reviewQueue || []).find((item) => item.id === "reddit-2njeymui-replay");
assert.ok(redditNaneinfQueueItem, "2NJEYMUI should stay in the replay queue for exact shop/reroll validation");
assert.ok(redditNaneinfQueueItem.targetSeeds?.includes("2NJEYMUI"));

const dualSourceSeed = seedById.get("PWX3AQJ8");
assert.ok(dualSourceSeed, "PWX3AQJ8 should be promoted from Reddit + BalatroSeeds evidence into the seed database");
assert.ok(dualSourceSeed.sources?.includes("balatroseeds-pwx3aqj8-ghost"));
assert.ok(dualSourceSeed.sources?.includes("reddit-pwx3aqj8-easiest-nan"));
assert.match(dualSourceSeed.summary || "", /Ghost Deck|Perkeo|Baron|Mime|Blueprint|Brainstorm/i);

const dualSourceDetail = routeData.seedDetails?.PWX3AQJ8;
assert.ok(dualSourceDetail, "PWX3AQJ8 should have a route detail");
assert.match(dualSourceDetail.completeness || "", /双来源|待复盘|candidate/i);
assert.ok((dualSourceDetail.flow || []).length >= 7, "PWX3AQJ8 should expose dual-source route nodes and uncertainty notes");
const dualSourceText = (dualSourceDetail.flow || [])
  .flatMap((stage) => [stage.stage, ...(stage.actions || [])])
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
assert.ok((dualSourceEvidence.facts || []).length >= 6, "PWX3AQJ8 BalatroSeeds evidence should preserve source-backed component facts");

const redditDualSourceEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-pwx3aqj8-easiest-nan");
assert.ok(redditDualSourceEvidence, "PWX3AQJ8 should have a Reddit evidence card");
assert.ok(redditDualSourceEvidence.seeds?.includes("PWX3AQJ8"));
assert.ok((redditDualSourceEvidence.facts || []).length >= 5, "PWX3AQJ8 Reddit evidence should preserve route and comment facts");

const dualSourceQueueItem = (siteData.reviewQueue || []).find((item) => item.id === "pwx3aqj8-dual-source-replay");
assert.ok(dualSourceQueueItem, "PWX3AQJ8 should stay in the replay queue for exact shop/pack validation");
assert.ok(dualSourceQueueItem.targetSeeds?.includes("PWX3AQJ8"));

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
const ghostNaneinfText = (ghostNaneinfDetail.flow || [])
  .flatMap((stage) => [stage.stage, ...(stage.actions || [])])
  .join("\n");
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

assert.equal(
  sourceMap["reddit-8q47wv6k-insane-seed"]?.url,
  "https://www.reddit.com/r/balatro/comments/1clvbv1/stumbled_across_an_insane_seed/"
);

const ghostRedditEvidence = (siteData.evidenceSources || []).find((item) => item.id === "reddit-8q47wv6k-insane-seed");
assert.ok(ghostRedditEvidence, "8Q47WV6K should have a Reddit evidence card");
assert.ok(ghostRedditEvidence.seeds?.includes("8Q47WV6K"));
assert.ok((ghostRedditEvidence.facts || []).length >= 7, "8Q47WV6K Reddit evidence should preserve source-backed route and comment facts");

const ghostReplayItem = (siteData.reviewQueue || []).find((item) => item.id === "reddit-8q47wv6k-replay");
assert.ok(ghostReplayItem, "8Q47WV6K should have a dedicated replay queue item");
assert.ok(ghostReplayItem.targetSeeds?.includes("8Q47WV6K"));

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
  "OCR.*低置信|人工视检",
  "无公开字幕",
  "无章节"
]) {
  assert.match(fastSteelKText, new RegExp(requiredText, "i"), `9OUU79 route provenance should include ${requiredText}`);
}

const fastSteelKEvidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-9ouu79");
assert.ok(fastSteelKEvidence, "9OUU79 should have a Bilibili evidence card");
assert.ok(fastSteelKEvidence.seeds?.includes("9OUU79"));
assert.ok((fastSteelKEvidence.facts || []).length >= 10, "9OUU79 evidence should preserve API, player/v2, comment, and image facts");
assert.match(fastSteelKEvidence.contentType || "", /API|评论|player\/v2|置顶攻略图|人工视检/);
assert.match((fastSteelKEvidence.facts || []).join("\n"), /258851541904|574\s*x\s*10799|subtitles|view_points|257583350320|≤\s*54|yt-dlp.*412/i);

const yushenSteelKDetail = routeData.seedDetails?.["90UU79"];
assert.ok(yushenSteelKDetail, "90UU79 should keep a Bilibili route detail");
assert.match(yushenSteelKDetail.sourceMode || "", /评论 API|player\/v2|分 P/);
assert.match(yushenSteelKDetail.videoStatus || "", /113639247843300|subtitles|view_points|无公开字幕|无章节|yt-dlp.*412/i);
const yushenSteelKText = [
  ...(yushenSteelKDetail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
  ...(yushenSteelKDetail.mistakes || [])
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
  "不是游戏版本号",
  "无公开字幕",
  "无章节"
]) {
  assert.match(yushenSteelKText, new RegExp(requiredText, "i"), `90UU79 route provenance should include ${requiredText}`);
}

const yushenSteelKEvidence = (siteData.evidenceSources || []).find((item) => item.id === "bili-90uu79-yushen");
assert.ok(yushenSteelKEvidence, "90UU79 should have a Bilibili evidence card");
assert.ok(yushenSteelKEvidence.seeds?.includes("90UU79"));
assert.ok((yushenSteelKEvidence.facts || []).length >= 10, "90UU79 evidence should preserve API, player/v2, comments, and uncertainty facts");
assert.match(yushenSteelKEvidence.contentType || "", /API|评论|player\/v2|分 P/);
assert.match((yushenSteelKEvidence.facts || []).join("\n"), /113639247843300|BV1ysq8YZExk|subtitles|view_points|17注的蓝图|20注负片DNA|男爵比哑剧多一张/i);

const chineseReplayDeepReview = (siteData.reviewQueue || []).find((item) => item.id === "bili-9ouu79-replay");
assert.ok(chineseReplayDeepReview, "9OUU79/90UU79 should remain in the deep review queue");
assert.match(chineseReplayDeepReview.nextAction || "", /9OUU79|90UU79|258851541904|17注的蓝图|20注负片DNA|无公开字幕|view_points/);

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
assert.ok((weiboImageEvidence.facts || []).length >= 7, "IRW4G69D evidence should preserve text facts and image verification facts");
assert.match((weiboImageEvidence.facts || []).join("\n"), /配图|灵媒|红封K|底注\s*18\/8|回合\s*54|OCR|商店顺序/i);

const weiboImageQueue = (siteData.reviewQueue || []).find((item) => item.id === "weibo-ocr-seed-post");
assert.ok(weiboImageQueue, "IRW4G69D should stay in the Weibo OCR/replay queue");
assert.ok(weiboImageQueue.targetSeeds?.includes("IRW4G69D"));
assert.match(weiboImageQueue.status || "", /ready-replay|ready-ocr/);
assert.match(weiboImageQueue.nextAction || "", /截图|红封K|底注 18\/8|商店顺序|实机复盘/);

console.log("Route harvest contracts passed");
