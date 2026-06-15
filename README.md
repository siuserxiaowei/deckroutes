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
```

BalatroSeeds queue pages can be converted into a reviewable draft route with:

```sh
node scripts/extract-balatroseed-route.mjs --url https://balatroseeds.com/seeds/Y3QRZZ5I/yellow-deck --source-id balatroseeds-y3qrzz5i
node scripts/test-extract-balatroseed-route.mjs
```

The extractor reads Jina Reader output or a saved fixture and emits a `detail` object shaped for `assets/data/route-data.json`, including `flow`, `queueTables`, source IDs, and seed-mismatch warnings. Treat the output as source-backed draft material until a human or replay pass validates purchase decisions.

As of the second 2026-06-15 pass, Agent Reach reports 13/15 channels available. Weibo is connected through `mcp-server-weibo`; XiaoHongShu MCP is reachable but still needs cookies/login before content can be collected; Douyin MCP is reachable but tested video parsing requires `DASHSCOPE_API_KEY`.

The data was compiled on 2026-06-15 with Agent Reach, Exa search, Bilibili public search, GitHub search, RDAP, and WHOIS checks. Domain status can change and should be rechecked at the registrar before purchase.

## Deploy

The site is plain HTML/CSS/JS and deploys from the repository root on GitHub Pages.
