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

addDuplicateErrors(seeds, "seed", "seed");
addDuplicateErrors(evidence, "id", "evidence");
addDuplicateErrors(reviewQueue, "id", "reviewQueue");

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
    if (!seedIds.has(seed)) warnings.push(`evidence ${id} mentions candidate seed not yet in seed database: ${seed}`);
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

const summary = {
  seeds: seeds.length,
  routeDetails: seedDetailIds.size,
  sources: sourceIds.size,
  evidence: evidence.length,
  reviewQueue: reviewQueue.length,
  warnings: warnings.length,
  errors: errors.length
};

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
console.log(`DeckRoutes data validation: ${JSON.stringify(summary)}`);

if (errors.length) process.exit(1);
