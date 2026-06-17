#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const siteData = JSON.parse(fs.readFileSync("assets/data/site-data.json", "utf8"));
const routeData = JSON.parse(fs.readFileSync("assets/data/route-data.json", "utf8"));
const appSource = fs.readFileSync("assets/app.js", "utf8");
const styleSource = fs.readFileSync("assets/styles.css", "utf8");

const seedIds = new Set([
  ...(siteData.seeds || []).map((seed) => seed.seed),
  ...(routeData.additionalSeeds || []).map((seed) => seed.seed)
]);
const detailIds = new Set(Object.keys(routeData.seedDetails || {}));

const routeReferences = [
  ...(siteData.evidenceSources || []).flatMap((item) =>
    (item.seeds || []).map((seed) => ({ scope: "evidenceSources", id: item.id, seed }))
  ),
  ...(siteData.reviewQueue || []).flatMap((item) =>
    (item.targetSeeds || []).map((seed) => ({ scope: "reviewQueue", id: item.id, seed }))
  )
];

const missingSeeds = routeReferences.filter((ref) => !seedIds.has(ref.seed));
assert.deepEqual(
  missingSeeds,
  [],
  `Every evidence/review seed reference must resolve to a seed card: ${missingSeeds
    .map((ref) => `${ref.scope}.${ref.id}:${ref.seed}`)
    .join(", ")}`
);

const missingDetails = routeReferences.filter((ref) => !detailIds.has(ref.seed));
assert.deepEqual(
  missingDetails,
  [],
  `Every evidence/review seed reference must open a route detail: ${missingDetails
    .map((ref) => `${ref.scope}.${ref.id}:${ref.seed}`)
    .join(", ")}`
);

assert.match(appSource, /function renderSeedLink\(/, "assets/app.js must expose a reusable route-link seed chip");
assert.match(
  appSource,
  /seedRow\.append\(renderSeedLink\(seed\)\)/,
  "Evidence seed chips must open the matching route detail"
);
assert.match(
  appSource,
  /seeds\.append\(renderSeedLink\(seed\)\)/,
  "Review queue target seed chips must open the matching route detail"
);
assert.match(styleSource, /\.seed-tag-button\b/, "Clickable seed chips must have a dedicated button style");
assert.match(appSource, /function renderRouteEvidenceImages\(/, "assets/app.js must render route evidence images");
assert.match(appSource, /renderRouteEvidenceImages\(detail\.evidenceImages \|\| \[\]\)/, "Route viewer must render detail evidenceImages");
assert.match(appSource, /route-evidence-card-unloaded/, "Evidence image cards must handle blocked or failed hotlinked images");
assert.match(appSource, /addEventListener\("error"/, "Evidence images must install an error fallback");
assert.match(
  fs.readFileSync("index.html", "utf8"),
  /id="routeEvidenceImages"/,
  "Route viewer must include an evidence image container"
);
assert.match(styleSource, /\.route-evidence-images\b/, "Evidence images must have a dedicated responsive style");
assert.match(styleSource, /\.route-evidence-card\b/, "Evidence image cards must have a stable style");
assert.match(
  appSource,
  /来源可复核的商店队列、牌包或作者流程节点/,
  "Route queue/table note must cover both raw queue data and source-backed author flow tables"
);
assert.doesNotMatch(
  appSource,
  /原始队列，不等同于最优购买路线/,
  "Route queue/table note must not describe every queueTables block as a raw queue"
);
assert.match(styleSource, /body\s*\{[\s\S]*overflow-x:\s*(?:hidden|clip)/, "Mobile pages must not allow wide tables to create body-level horizontal scroll");
assert.match(styleSource, /main\s*\{[\s\S]*overflow-x:\s*(?:hidden|clip)/, "The main content shell must clip wide child scroll areas on mobile");
assert.match(styleSource, /\.table-wrap\s*\{[\s\S]*overflow-x:\s*auto/, "Wide source tables must remain scrollable inside their own container");

console.log("Route link contracts passed");
