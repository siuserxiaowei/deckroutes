import assert from "node:assert/strict";
import fs from "node:fs";

const siteData = JSON.parse(fs.readFileSync("assets/data/site-data.json", "utf8"));
const routeData = JSON.parse(fs.readFileSync("assets/data/route-data.json", "utf8"));
const indexSource = fs.readFileSync("index.html", "utf8");
const appSource = fs.readFileSync("assets/app.js", "utf8");
const styleSource = fs.readFileSync("assets/styles.css", "utf8");

const sourceIds = new Set([
  ...Object.keys(siteData.sources || {}),
  ...Object.keys(routeData.sourceAdditions || {})
]);
const seedIds = new Set([...(siteData.seeds || []), ...(routeData.additionalSeeds || [])].map((seed) => seed.seed));
const evidenceIds = new Set((siteData.evidenceSources || []).map((item) => item.id));
const seoClusters = siteData.seoClusters || [];
const seoClusterIds = new Set(seoClusters.map((item) => item.id));

assert.ok(seoClusters.length >= 6, "SEO cluster system should expose at least six page opportunities");

for (const requiredId of [
  "steel-king-route-hub",
  "baron-mime-engine",
  "perkeo-cryptid-naneinf",
  "plasma-deck-route-index",
  "ghost-deck-route-index",
  "next-games-guide-hub"
]) {
  assert.ok(seoClusterIds.has(requiredId), `Missing SEO cluster: ${requiredId}`);
}

for (const cluster of seoClusters) {
  assert.ok((cluster.targetKeywords || []).length >= 3, `${cluster.id} needs long-tail keywords`);
  assert.ok((cluster.supportingSeeds || []).length >= 1, `${cluster.id} needs seed support`);
  assert.ok((cluster.evidenceIds || []).length >= 1, `${cluster.id} needs evidence support`);
  assert.ok((cluster.sourceIds || []).length >= 1, `${cluster.id} needs source support`);
  assert.ok((cluster.routeTypes || []).length >= 1, `${cluster.id} needs route type labels`);
  assert.ok((cluster.doNotClaim || []).length >= 2, `${cluster.id} needs overclaim guardrails`);
  assert.ok((cluster.internalLinks || []).every((link) => link.startsWith("#")), `${cluster.id} internal links must be anchors`);

  for (const seed of cluster.supportingSeeds || []) {
    assert.ok(seedIds.has(seed), `${cluster.id} references missing seed ${seed}`);
  }
  for (const evidenceId of cluster.evidenceIds || []) {
    assert.ok(evidenceIds.has(evidenceId), `${cluster.id} references missing evidence ${evidenceId}`);
  }
  for (const sourceId of cluster.sourceIds || []) {
    assert.ok(sourceIds.has(sourceId), `${cluster.id} references missing source ${sourceId}`);
  }
}

const steelKing = seoClusters.find((item) => item.id === "steel-king-route-hub");
assert.ok(steelKing.supportingSeeds.includes("9OUU79"), "Steel King hub should include 9OUU79");
assert.ok(steelKing.supportingSeeds.includes("BUMBYCX2"), "Steel King hub should include BUMBYCX2");
assert.match(steelKing.doNotClaim.join(" "), /完整逐店|保证|稳定 naneinf/, "Steel King hub should carry explicit overclaim guardrails");

const baronMime = seoClusters.find((item) => item.id === "baron-mime-engine");
assert.ok(baronMime.supportingSeeds.includes("6B678B4W"), "Baron/Mime hub should include 6B678B4W");
assert.ok(baronMime.evidenceIds.includes("gamesgg-baron-mime"), "Baron/Mime hub should include a mechanism guide evidence source");

const naneinf = seoClusters.find((item) => item.id === "perkeo-cryptid-naneinf");
assert.match(naneinf.status, /guarded|candidate/i, "naneinf page must be guarded or candidate-labeled");
assert.match(naneinf.doNotClaim.join(" "), /稳定 naneinf|必出 nan|description-backed/, "naneinf page must explicitly forbid overclaiming");
assert.ok(naneinf.routeTypes.includes("candidate"), "naneinf page must expose candidate route type");

const rounds = siteData.researchRounds || [];
assert.ok(rounds.length >= 1, "A research round source pool should be recorded");
const latestRound = rounds[0];
assert.ok((latestRound.candidates || []).length >= 15, "Research round should include at least 15 candidate sources");
assert.ok((latestRound.candidates || []).length <= 25, "Research round should stay bounded to 25 candidate sources");
assert.match(latestRound.channelStatus, /9\/15|Agent Reach|Cookie/, "Research round should record Agent Reach channel limits");
assert.ok((latestRound.searchTerms || []).some((term) => /钢K/.test(term)), "Research round should include Chinese Steel King search terms");
assert.ok((latestRound.searchTerms || []).some((term) => /naneinf/i.test(term)), "Research round should include naneinf search terms");

for (const candidate of latestRound.candidates || []) {
  assert.ok(candidate.url?.startsWith("http"), `${candidate.title} should have a public URL`);
  assert.ok((candidate.mappedAssets || []).length >= 1, `${candidate.title} should map back to a site asset`);
  for (const asset of candidate.mappedAssets || []) {
    if (asset.startsWith("seoClusters:")) {
      const [, clusterId] = asset.split(":");
      assert.ok(seoClusterIds.has(clusterId), `${candidate.title} maps to missing SEO cluster ${clusterId}`);
    }
  }
}

assert.match(indexSource, /id="seo"/, "index.html must expose the SEO section");
assert.match(indexSource, /id="seoClusterGrid"/, "index.html must expose the SEO cluster grid");
assert.match(indexSource, /id="researchRound"/, "index.html must expose the research source pool");
assert.match(appSource, /function renderSeoClusters\(/, "assets/app.js must render SEO clusters");
assert.match(appSource, /function renderResearchRound\(/, "assets/app.js must render the research source pool");
assert.match(styleSource, /\.seo-cluster-grid\b/, "SEO clusters need a responsive grid style");
assert.match(styleSource, /\.research-table-wrap\b/, "Research source pool needs a bounded table style");

console.log("SEO cluster contracts passed");
