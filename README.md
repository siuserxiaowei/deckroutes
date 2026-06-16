# DeckRoutes

DeckRoutes is a static GitHub Pages guide site for Balatro seeds, Steel King routes, source-backed strategy notes, Chinese video demand signals, and future small-game guide opportunities.

## First version

- Balatro seed database with search, archetype filters, tag filters, and copy buttons.
- Steel King / Baron / Mime route modules with attributed sources.
- Cross-platform platform-status board for Agent Reach, Bilibili, WeChat, XiaoHongShu, Douyin, Weibo, Scrapling, and browser automation availability.
- Evidence pool that separates source-backed facts, route inference, and pending replay-review items.
- Review queue for XiaoHongShu login capture, Douyin metadata parsing, Weibo OCR, Bilibili replay review, and seed-bank refresh tasks.
- Chinese Bilibili video demand board.
- Competitor/tool site signals and domain shortlist.
- Original generated WebP guide imagery stored under `assets/images/`.

## Data

Index content is in `assets/data/site-data.json`.

Seed route details and replay-review notes are in `assets/data/route-data.json`.

`site-data.json` also contains the current `platformStatus`, `evidenceSources`, and `reviewQueue` records. Sources marked as pending replay review should not be treated as complete route guides.

Run the local data guard before publishing a new evidence or route update:

```sh
node scripts/validate-data.mjs
node scripts/audit-route-coverage.mjs --fail-on-gaps
node scripts/test-extract-balatroseed-route.mjs
node scripts/test-route-link-contracts.mjs
```

BalatroSeeds queue pages can be converted into a reviewable draft route with:

```sh
node scripts/extract-balatroseed-route.mjs --url https://balatroseeds.com/seeds/Y3QRZZ5I/yellow-deck --source-id balatroseeds-y3qrzz5i
node scripts/extract-balatroseed-route.mjs --source-id balatroseeds-afbwb2-ghost --data-root . --timeout-ms 5000
node scripts/test-extract-balatroseed-route.mjs
```

The extractor reads Jina Reader output or a saved fixture and emits a `detail` object shaped for `assets/data/route-data.json`, including `flow`, `queueTables`, source IDs, and seed-mismatch warnings. Use `--source-id ... --data-root .` to resolve an existing URL from `site-data.json` and `route-data.json` without copying it by hand. If Jina is unavailable, BalatroSeeds URL reads fall back to the page HTML meta description; the parser also handles non-Ante prose sections such as `Blind`, `Shop`, `Continuation`, and `Steps`. Treat the output as source-backed draft material until a human or replay pass validates purchase decisions.

GitHub Actions runs the same data guard and extractor tests through `.github/workflows/validate.yml` on pushes to `main` and on pull requests.

`scripts/audit-route-coverage.mjs` prints a non-network coverage report for seed details, route quality (`playable/full`, `node-summary`, `candidate`, `blocked-source`, `thin-summary`), queue-table coverage, platform evidence, blocked review work, and high-priority next actions. Use `--json` for machine-readable output, and `--fail-on-gaps` when the run should fail on missing route detail, empty flow, missing source backlink, or a route that claims full/playable coverage but audits as incomplete.

As of the eighth 2026-06-16 pass, Agent Reach's default doctor reports 9/15 channels available, while `mcporter --config /Users/siuserxiaowei/config/mcporter.json list` still reports healthy XiaoHongShu, Douyin, Weibo, and Exa MCP servers. Exa reached the free MCP rate limit during this pass; XiaoHongShu still returns EOF on `search_feeds("小丑牌 钢K 种子")`; Douyin video parsing still requires `DASHSCOPE_API_KEY`; Reddit and YouTube require cookie/proxy follow-up for reliable deep reads.

The data was compiled on 2026-06-15 and updated on 2026-06-16 with Agent Reach, Exa search, Jina Reader, Bilibili public search, GitHub search, RDAP, and WHOIS checks. Domain status can change and should be rechecked at the registrar before purchase.

## Deploy

The site is plain HTML/CSS/JS and deploys from the repository root on GitHub Pages.
