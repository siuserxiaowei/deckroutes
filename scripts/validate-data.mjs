import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sitePath = path.join(root, "assets/data/site-data.json");
const routePath = path.join(root, "assets/data/route-data.json");

const errors = [];
const warnings = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`Cannot parse ${path.relative(root, filePath)}: ${error.message}`);
    return {};
  }
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function addDuplicateErrors(items, field, label) {
  const seen = new Set();
  for (const item of items || []) {
    const value = item?.[field];
    if (!hasValue(value)) {
      errors.push(`${label} entry is missing ${field}`);
      continue;
    }
    if (seen.has(value)) errors.push(`${label} has duplicate ${field}: ${value}`);
    seen.add(value);
  }
}

function assertRefs(refs, validSet, label, itemId, allowEmpty = true) {
  if (!Array.isArray(refs)) {
    errors.push(`${label} ${itemId} refs must be an array`);
    return;
  }
  if (!allowEmpty && refs.length === 0) {
    errors.push(`${label} ${itemId} must include at least one ref`);
  }
  for (const ref of refs) {
    if (!validSet.has(ref)) errors.push(`${label} ${itemId} references missing id: ${ref}`);
  }
}

function normalizeUrl(value) {
  return typeof value === "string" ? value.replace(/\/+$/, "") : "";
}

const site = readJson(sitePath);
const routeData = readJson(routePath);

const sourceMap = {
  ...(site.sources || {}),
  ...(routeData.sourceAdditions || {})
};
const sourceIds = new Set(Object.keys(sourceMap));
const seeds = [...(site.seeds || []), ...(routeData.additionalSeeds || [])];
const seedById = new Map(seeds.map((seed) => [seed.seed, seed]));
const seedIds = new Set(seeds.map((seed) => seed.seed));
const seedDetailIds = new Set(Object.keys(routeData.seedDetails || {}));
const evidence = site.evidenceSources || [];
const evidenceIds = new Set(evidence.map((item) => item.id));
const evidenceSeedIds = new Set(evidence.flatMap((item) => item.seeds || []));
const knownOrCandidateSeedIds = new Set([...seedIds, ...evidenceSeedIds]);
const reviewQueue = site.reviewQueue || [];
const queuedSeedIds = new Set(reviewQueue.flatMap((item) => item.targetSeeds || []));
const statsByLabel = new Map((site.stats || []).map((item) => [item.label, item]));
const seoClusters = site.seoClusters || [];
const researchRounds = site.researchRounds || [];

const allowedRouteTypes = new Set([
  "raw Shop Queue",
  "prose-backed",
  "description-backed",
  "video-node",
  "comment-branch",
  "OCR/manual-review",
  "candidate",
  "blocked-source"
]);

addDuplicateErrors(seeds, "seed", "seed");
addDuplicateErrors(evidence, "id", "evidence");
addDuplicateErrors(reviewQueue, "id", "reviewQueue");
addDuplicateErrors(seoClusters, "id", "seoClusters");
addDuplicateErrors(researchRounds, "id", "researchRounds");

for (const [id, source] of Object.entries(sourceMap)) {
  if (!hasValue(source.label)) errors.push(`source ${id} is missing label`);
  if (!hasValue(source.url)) errors.push(`source ${id} is missing url`);
}

for (const seed of seeds) {
  if (!hasValue(seed.title)) errors.push(`seed ${seed.seed || "(missing)"} is missing title`);
  assertRefs(seed.sources || [], sourceIds, "seed", seed.seed, false);
  if (!seedDetailIds.has(seed.seed)) warnings.push(`seed ${seed.seed} has no route detail`);
}

for (const [seedId, detail] of Object.entries(routeData.seedDetails || {})) {
  if (!seedIds.has(seedId)) errors.push(`route detail exists for unknown seed: ${seedId}`);
  if (!hasValue(detail.completeness)) errors.push(`route detail ${seedId} is missing completeness`);
  if (!Array.isArray(detail.flow) || detail.flow.length === 0) errors.push(`route detail ${seedId} has empty flow`);
  const sourceRefs = detail.sources || seedById.get(seedId)?.sources || [];
  assertRefs(sourceRefs, sourceIds, "route detail", seedId, false);
}

for (const item of evidence) {
  const id = item.id || "(missing)";
  if (!hasValue(item.platform)) errors.push(`evidence ${id} is missing platform`);
  if (!hasValue(item.title)) errors.push(`evidence ${id} is missing title`);
  if (!hasValue(item.url)) errors.push(`evidence ${id} is missing url`);
  if (!Array.isArray(item.facts) || item.facts.length === 0) errors.push(`evidence ${id} has no facts`);
  for (const seed of item.seeds || []) {
    if (!seedIds.has(seed) && !queuedSeedIds.has(seed)) {
      warnings.push(`evidence ${id} mentions candidate seed not yet in seed database or reviewQueue: ${seed}`);
    }
  }
}

for (const item of reviewQueue) {
  const id = item.id || "(missing)";
  for (const field of ["title", "platform", "priority", "status", "nextAction", "validation", "updatedAt"]) {
    if (!hasValue(item[field])) errors.push(`reviewQueue ${id} is missing ${field}`);
  }
  assertRefs(item.evidenceIds || [], evidenceIds, "reviewQueue evidenceIds", id, true);
  assertRefs(item.sourceIds || [], sourceIds, "reviewQueue sourceIds", id, true);
  assertRefs(item.targetSeeds || [], knownOrCandidateSeedIds, "reviewQueue targetSeeds", id, true);
}

for (const item of seoClusters) {
  const id = item.id || "(missing)";
  for (const field of ["title", "searchIntent", "pageType", "priority", "status", "evidenceStrength", "cta", "nextAction"]) {
    if (!hasValue(item[field])) errors.push(`seoClusters ${id} is missing ${field}`);
  }
  assertRefs(item.supportingSeeds || [], seedIds, "seoClusters supportingSeeds", id, false);
  assertRefs(item.evidenceIds || [], evidenceIds, "seoClusters evidenceIds", id, false);
  assertRefs(item.sourceIds || [], sourceIds, "seoClusters sourceIds", id, false);
  for (const field of ["targetKeywords", "routeTypes", "doNotClaim", "internalLinks"]) {
    if (!Array.isArray(item[field]) || item[field].length === 0) {
      errors.push(`seoClusters ${id} must include non-empty ${field}`);
    }
  }
  for (const routeType of item.routeTypes || []) {
    if (!allowedRouteTypes.has(routeType)) errors.push(`seoClusters ${id} has unknown route type: ${routeType}`);
  }
  for (const link of item.internalLinks || []) {
    if (typeof link !== "string" || !link.startsWith("#")) errors.push(`seoClusters ${id} has invalid internal link: ${link}`);
  }
  if ((item.doNotClaim || []).length < 2) errors.push(`seoClusters ${id} should include at least two doNotClaim guardrails`);
}

for (const round of researchRounds) {
  const id = round.id || "(missing)";
  for (const field of ["title", "date", "channelStatus"]) {
    if (!hasValue(round[field])) errors.push(`researchRounds ${id} is missing ${field}`);
  }
  if (!Array.isArray(round.questions) || round.questions.length === 0) {
    errors.push(`researchRounds ${id} must include questions`);
  }
  if (!Array.isArray(round.searchTerms) || round.searchTerms.length === 0) {
    errors.push(`researchRounds ${id} must include searchTerms`);
  }
  if (!Array.isArray(round.candidates)) {
    errors.push(`researchRounds ${id} candidates must be an array`);
    continue;
  }
  if (round.candidates.length < 15 || round.candidates.length > 25) {
    errors.push(`researchRounds ${id} should include 15-25 candidates, got ${round.candidates.length}`);
  }
  round.candidates.forEach((candidate, index) => {
    const candidateId = `${id}#${index + 1}`;
    for (const field of ["title", "url", "platform", "tool", "retrievedAt", "access", "deck", "version", "initialValue", "deepResearch", "evidenceStrength"]) {
      if (!hasValue(candidate[field])) errors.push(`research candidate ${candidateId} is missing ${field}`);
    }
    if (candidate.sourceId && !sourceIds.has(candidate.sourceId)) {
      errors.push(`research candidate ${candidateId} references missing sourceId: ${candidate.sourceId}`);
    }
    if (candidate.evidenceId && !evidenceIds.has(candidate.evidenceId)) {
      errors.push(`research candidate ${candidateId} references missing evidenceId: ${candidate.evidenceId}`);
    }
    if (candidate.sourceId || candidate.evidenceId) {
      const allowedUrls = [
        sourceMap[candidate.sourceId]?.url,
        evidence.find((item) => item.id === candidate.evidenceId)?.url
      ]
        .map(normalizeUrl)
        .filter(Boolean);
      if (allowedUrls.length && !allowedUrls.includes(normalizeUrl(candidate.url))) {
        errors.push(`research candidate ${candidateId} URL does not match its source/evidence reference`);
      }
    }
    assertRefs(candidate.seeds || [], knownOrCandidateSeedIds, "research candidate seeds", candidateId, true);
    if (!Array.isArray(candidate.mappedAssets) || candidate.mappedAssets.length === 0) {
      errors.push(`research candidate ${candidateId} must include mappedAssets`);
    }
  });
}

const expectedStats = [
  ["已整理种子", seeds.length],
  ["证据来源", evidence.length],
  ["SEO专题", seoClusters.length],
  ["复盘队列", reviewQueue.length]
];

for (const [label, expectedValue] of expectedStats) {
  const stat = statsByLabel.get(label);
  if (!stat) {
    errors.push(`stats is missing label: ${label}`);
    continue;
  }
  if (String(stat.value) !== String(expectedValue)) {
    errors.push(`stats ${label} value ${stat.value} does not match actual ${expectedValue}`);
  }
}

const summary = {
  seeds: seeds.length,
  routeDetails: seedDetailIds.size,
  sources: sourceIds.size,
  evidence: evidence.length,
  seoClusters: seoClusters.length,
  researchRounds: researchRounds.length,
  researchCandidates: researchRounds.reduce((count, round) => count + (round.candidates || []).length, 0),
  reviewQueue: reviewQueue.length,
  warnings: warnings.length,
  errors: errors.length
};

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(`DeckRoutes data validation: ${JSON.stringify(summary)}`);

if (errors.length) process.exit(1);
