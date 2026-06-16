#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sitePath = path.join(root, "assets/data/site-data.json");
const routePath = path.join(root, "assets/data/route-data.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function countBy(items, getKey) {
  const counts = new Map();
  for (const item of items || []) {
    const key = getKey(item) || "未分组";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN")));
}

function topEntries(counts, limit = 8) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, limit);
}

function hasQueueTable(detail) {
  return (detail.queueTables || []).some((table) => (table.shopQueue || []).length || (table.packs || []).length);
}

function hasCompleteLikeFlow(detail) {
  const text = [detail.completeness, detail.sourceMode, ...(detail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])])]
    .join(" ")
    .toLowerCase();
  return /完整|ante\s*1-8|1-8|近完整|full|queue/.test(text);
}

function visibleQueueTables(detail) {
  return (detail.queueTables || []).filter((table) => (table.shopQueue || []).length || (table.packs || []).length);
}

function detailText(detail) {
  return [
    detail.completeness,
    detail.sourceMode,
    detail.videoStatus,
    ...(detail.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])]),
    ...(detail.mistakes || []),
    ...(detail.queueTables || []).flatMap((table) => [table.title, table.routeUse, table.boss, table.voucher, ...(table.tags || [])])
  ]
    .filter(Boolean)
    .join(" ");
}

function maxAnteFromText(text) {
  const matches = [...text.matchAll(/(?:ante|底注)\s*(\d{1,2})|(?:^|\s)(\d{1,2})-\d{1,2}/gi)];
  const antes = matches.map((match) => Number(match[1] || match[2])).filter(Number.isFinite);
  return antes.length ? Math.max(...antes) : null;
}

function routeQuality(detail, seed = {}) {
  if (!detail) {
    return {
      quality: "missing-detail",
      stageCount: 0,
      actionCount: 0,
      visibleQueueTables: 0,
      rawQueueTables: 0,
      maxAnte: null,
      claimedFull: false,
      hasCandidateLanguage: false
    };
  }

  const text = detailText(detail);
  const lower = text.toLowerCase();
  const flow = detail.flow || [];
  const actionCount = flow.reduce((sum, stage) => sum + (stage.actions || []).length, 0);
  const queueTables = detail.queueTables || [];
  const visibleQueues = visibleQueueTables(detail);
  const claimText = [detail.completeness, detail.sourceMode].filter(Boolean).join(" ");
  const hasClaimExclusion = /近完整|候选|待|节点型|部分完整|队列样本|决策待验证/.test(claimText);
  const rawFullClaim =
    /完整流程|可照做完整|完整到\s*(?:ante\s*)?8|ante\s*1-8\s*(?:完整|可照做|playable|full)|playable/i.test(claimText) ||
    /完整/.test(detail.completeness || "");
  const claimedFull = rawFullClaim && !hasClaimExclusion;
  const hasBlockedSourceLanguage = /403|api key|login|登录|eof|bot check|未设置|未能直读|当前不能抽字幕|当前不能证明/.test(lower);
  const hasCandidateLanguage = /候选|待补|待验证|待复盘|描述级|摘要|占位|不是完整|不标完整|不能直接|缺完整|未能直读|当前只有/.test(text);
  const maxAnte = maxAnteFromText(text);

  let quality = "node-summary";
  if (hasBlockedSourceLanguage) {
    quality = "blocked-source";
  } else if (hasCandidateLanguage) {
    quality = "candidate";
  } else if (visibleQueues.length && /队列|queue/i.test(text)) {
    quality = "raw-queue";
  } else if (claimedFull && actionCount >= 8 && (maxAnte || 0) >= 8 && seedSourceIds(seed, detail).length) {
    quality = "playable/full";
  } else if (flow.length < 2 || actionCount < 5) {
    quality = "thin-summary";
  }

  return {
    quality,
    stageCount: flow.length,
    actionCount,
    visibleQueueTables: visibleQueues.length,
    rawQueueTables: queueTables.length,
    maxAnte,
    claimedFull,
    hasCandidateLanguage
  };
}

function seedSourceIds(seed, detail) {
  return [...new Set([...(seed.sources || []), ...(detail?.sources || []), ...((detail?.queueTables || []).flatMap((table) => table.sourceIds || []))])];
}

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    failOnGaps: argv.includes("--fail-on-gaps")
  };
}

const args = parseArgs(process.argv.slice(2));
const site = readJson(sitePath);
const routeData = readJson(routePath);

const sourceMap = {
  ...(site.sources || {}),
  ...(routeData.sourceAdditions || {})
};
const seeds = [...(site.seeds || []), ...(routeData.additionalSeeds || [])];
const seedDetails = routeData.seedDetails || {};
const evidence = site.evidenceSources || [];
const reviewQueue = site.reviewQueue || [];
const platformStatus = site.platformStatus || [];

const details = seeds.map((seed) => ({
  seed,
  detail: seedDetails[seed.seed] || null
}));

const missingDetails = details.filter((item) => !item.detail).map((item) => item.seed.seed);
const detailsWithoutFlow = details
  .filter((item) => item.detail && (!Array.isArray(item.detail.flow) || item.detail.flow.length === 0))
  .map((item) => item.seed.seed);
const detailsWithQueueTables = details.filter((item) => item.detail && hasQueueTable(item.detail)).map((item) => item.seed.seed);
const completeLikeDetails = details.filter((item) => item.detail && hasCompleteLikeFlow(item.detail)).map((item) => item.seed.seed);
const detailsWithoutEvidenceBacklink = details
  .filter((item) => item.detail && !seedSourceIds(item.seed, item.detail).length)
  .map((item) => item.seed.seed);
const qualityBySeed = details.map((item) => ({
  seed: item.seed.seed,
  ...routeQuality(item.detail, item.seed)
}));
const thinDetails = qualityBySeed
  .filter((item) => ["thin-summary", "candidate", "blocked-source"].includes(item.quality))
  .map((item) => ({
    seed: item.seed,
    quality: item.quality,
    stageCount: item.stageCount,
    actionCount: item.actionCount,
    maxAnte: item.maxAnte
  }));
const fullClaimIssues = qualityBySeed
  .filter((item) => item.claimedFull && item.quality !== "playable/full")
  .map((item) => ({
    seed: item.seed,
    quality: item.quality,
    stageCount: item.stageCount,
    actionCount: item.actionCount,
    maxAnte: item.maxAnte
  }));
const evidenceWithSeeds = evidence.filter((item) => (item.seeds || []).length);
const evidenceWithoutSeeds = evidence.filter((item) => !(item.seeds || []).length);
const blockedQueue = reviewQueue.filter((item) => String(item.status || "").startsWith("blocked") || item.blocker);
const highPriorityQueue = reviewQueue.filter((item) => ["S", "A"].includes(item.priority));
const unusablePlatforms = platformStatus.filter((item) => item.usableNow === false);
const queueTargetSeeds = new Set(reviewQueue.flatMap((item) => item.targetSeeds || []));
const queuedCandidates = [...queueTargetSeeds].filter((seed) => !seeds.some((item) => item.seed === seed));

const routeEvidenceSeedSet = new Set(evidenceWithSeeds.flatMap((item) => item.seeds || []));
const seedsWithoutSeedEvidence = seeds
  .filter((seed) => !routeEvidenceSeedSet.has(seed.seed))
  .map((seed) => seed.seed);

const report = {
  generatedAt: new Date().toISOString(),
  counts: {
    seeds: seeds.length,
    routeDetails: Object.keys(seedDetails).length,
    sources: Object.keys(sourceMap).length,
    evidence: evidence.length,
    evidenceWithSeeds: evidenceWithSeeds.length,
    evidenceWithoutSeeds: evidenceWithoutSeeds.length,
    reviewQueue: reviewQueue.length,
    platformStatus: platformStatus.length
  },
  routeCoverage: {
    seedsWithDetails: seeds.length - missingDetails.length,
    detailCoveragePct: Number((((seeds.length - missingDetails.length) / Math.max(seeds.length, 1)) * 100).toFixed(1)),
    detailsWithQueueTables: detailsWithQueueTables.length,
    queueTableCoveragePct: Number(((detailsWithQueueTables.length / Math.max(seeds.length, 1)) * 100).toFixed(1)),
    completeLikeDetails: completeLikeDetails.length,
    completeLikeCoveragePct: Number(((completeLikeDetails.length / Math.max(seeds.length, 1)) * 100).toFixed(1)),
    missingDetails,
    detailsWithoutFlow,
    detailsWithoutEvidenceBacklink,
    seedsWithoutSeedEvidence,
    thinDetails,
    fullClaimIssues
  },
  distributions: {
    seedsByArchetype: countBy(seeds, (seed) => seed.archetype),
    seedsByDifficulty: countBy(seeds, (seed) => seed.difficulty),
    routeQuality: countBy(qualityBySeed, (item) => item.quality),
    evidenceByPlatform: countBy(evidence, (item) => item.platform),
    reviewQueueByStatus: countBy(reviewQueue, (item) => item.status),
    reviewQueueByPriority: countBy(reviewQueue, (item) => item.priority),
    platformUsability: countBy(platformStatus, (item) => (item.usableNow ? "usable" : "blocked"))
  },
  reviewQueue: {
    blocked: blockedQueue.map((item) => ({
      id: item.id,
      platform: item.platform,
      priority: item.priority,
      status: item.status,
      blocker: item.blocker || ""
    })),
    highPriority: highPriorityQueue.map((item) => ({
      id: item.id,
      platform: item.platform,
      priority: item.priority,
      status: item.status,
      targetSeeds: item.targetSeeds || []
    })),
    queuedCandidates
  },
  platforms: {
    unusable: unusablePlatforms.map((item) => ({
      platform: item.platform,
      status: item.status,
      limitation: item.limitation,
      nextAction: item.nextAction
    }))
  }
};

const fatalGaps = [
  ...missingDetails.map((seed) => `seed ${seed} has no route detail`),
  ...detailsWithoutFlow.map((seed) => `route detail ${seed} has no flow`),
  ...detailsWithoutEvidenceBacklink.map((seed) => `route detail ${seed} has no source backlink`),
  ...fullClaimIssues.map((item) => `route detail ${item.seed} claims full/playable coverage but audits as ${item.quality}`)
];

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("DeckRoutes route coverage audit");
  console.log(`- Seeds: ${report.counts.seeds}`);
  console.log(`- Route detail coverage: ${report.routeCoverage.seedsWithDetails}/${report.counts.seeds} (${report.routeCoverage.detailCoveragePct}%)`);
  console.log(`- Queue-table details: ${report.routeCoverage.detailsWithQueueTables}/${report.counts.seeds} (${report.routeCoverage.queueTableCoveragePct}%)`);
  console.log(`- Complete-like details: ${report.routeCoverage.completeLikeDetails}/${report.counts.seeds} (${report.routeCoverage.completeLikeCoveragePct}%)`);
  console.log(`- Thin/candidate details: ${report.routeCoverage.thinDetails.length}`);
  console.log(`- Full-claim issues: ${report.routeCoverage.fullClaimIssues.length}`);
  console.log(`- Evidence: ${report.counts.evidence} total, ${report.counts.evidenceWithSeeds} seed-linked, ${report.counts.evidenceWithoutSeeds} platform/market-only`);
  console.log(`- Review queue: ${report.counts.reviewQueue} total, ${report.reviewQueue.blocked.length} blocked, ${report.reviewQueue.highPriority.length} S/A priority`);
  console.log(`- Unusable platform entries: ${report.platforms.unusable.length}`);
  console.log("");
  console.log("Route quality:");
  for (const [quality, count] of topEntries(report.distributions.routeQuality, 10)) {
    console.log(`- ${quality}: ${count}`);
  }
  console.log("");
  console.log("Top evidence platforms:");
  for (const [platform, count] of topEntries(report.distributions.evidenceByPlatform)) {
    console.log(`- ${platform}: ${count}`);
  }
  console.log("");
  console.log("High-priority queue:");
  for (const item of report.reviewQueue.highPriority) {
    console.log(`- ${item.priority} ${item.id} [${item.status}] targets=${(item.targetSeeds || []).join(",") || "-"}`);
  }
  if (fatalGaps.length) {
    console.log("");
    console.log("Fatal route data gaps:");
    for (const gap of fatalGaps) console.log(`- ${gap}`);
  }
}

if (args.failOnGaps && fatalGaps.length) {
  process.exitCode = 1;
}
