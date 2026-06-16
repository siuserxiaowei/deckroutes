#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const PACK_PATTERN = "(?:Mega\\s+|Jumbo\\s+)?(?:Arcana|Celestial|Spectral|Buffoon|Standard)\\s+Pack\\s+-";

function cleanText(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function decodeHtmlEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\""
  };

  return String(value || "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body) => {
    const key = body.toLowerCase();
    if (key.startsWith("#x")) return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    if (key.startsWith("#")) return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    return named[key] ?? entity;
  });
}

function extractHtmlAttribute(html, pattern) {
  const match = html.match(pattern);
  return match ? decodeHtmlEntities(match[1]) : "";
}

export function htmlToMarkdownSnapshot(html, sourceUrl = "") {
  const title = cleanText(extractHtmlAttribute(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const description = cleanText(
    extractHtmlAttribute(html, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
      || extractHtmlAttribute(html, /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i)
  );

  if (!title && !description) return "";

  return [
    title ? `Title: ${title}` : "",
    sourceUrl ? `URL Source: ${sourceUrl}` : "",
    "Markdown Content:",
    title ? `# ${title}` : "",
    description
  ]
    .filter(Boolean)
    .join("\n\n");
}

function titleCaseSlug(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

export function resolveSourceUrl(sourceId, siteData = {}, routeData = {}) {
  const sourceMap = {
    ...(siteData.sources || {}),
    ...(routeData.sourceAdditions || {})
  };
  const url = sourceMap[sourceId]?.url;
  if (!url) throw new Error(`Unknown source id or missing URL: ${sourceId}`);
  return url;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function resolveSourceUrlFromDataRoot(sourceId, dataRoot) {
  const root = String(dataRoot || ".").replace(/\/+$/, "") || ".";
  const [siteData, routeData] = await Promise.all([
    readJson(`${root}/assets/data/site-data.json`),
    readJson(`${root}/assets/data/route-data.json`)
  ]);
  return resolveSourceUrl(sourceId, siteData, routeData);
}

export function toJinaReaderUrl(inputUrl) {
  const url = String(inputUrl || "").trim();
  if (!url) throw new Error("Missing URL");
  if (/^https?:\/\/r\.jina\.ai\//i.test(url)) return url;
  const withoutProtocol = url.replace(/^https?:\/\//i, "").replace(/^\/+/, "");
  return `https://r.jina.ai/http://${withoutProtocol}`;
}

function extractSourceUrl(markdown, fallback = "") {
  const match = markdown.match(/^URL Source:\s*(.+)$/im);
  return cleanText(match?.[1] || fallback);
}

function extractTitle(markdown) {
  const titleLine = markdown.match(/^Title:\s*(.+)$/im)?.[1];
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1];
  return cleanText(titleLine || heading || "");
}

function addSeedCandidate(candidates, kind, value) {
  const seed = cleanText(value).toUpperCase();
  if (/^[A-Z0-9]{4,12}$/.test(seed)) candidates.push({ kind, value: seed });
}

function extractSeedCandidates(markdown, title, sourceUrl) {
  const candidates = [];

  for (const match of markdown.matchAll(/(?:^|\n)\s*(?:#{1,6}\s*)?SEED\s*(?:\n|\s)+(?:[`*_>\s-]*)([A-Z0-9]{4,12})(?=\b|[`*_])/gi)) {
    addSeedCandidate(candidates, "body-seed-label", match[1]);
  }

  addSeedCandidate(candidates, "title", title.match(/Balatro Seed:\s*([A-Z0-9]{4,12})/i)?.[1]);
  addSeedCandidate(candidates, "heading", markdown.match(/^#\s*Balatro Seed:\s*([A-Z0-9]{4,12})/im)?.[1]);
  addSeedCandidate(candidates, "url-slug", sourceUrl.match(/\/seeds\/([A-Z0-9]{4,12})(?:[/?#-]|$)/i)?.[1]);

  return candidates;
}

function extractDeck(markdown, title, sourceUrl) {
  const fromTitle = title.match(/\(([^()]*\bDeck)\)/i)?.[1];
  if (fromTitle) return cleanText(fromTitle);

  const fromLine = markdown.match(/^\s*(?:#{1,6}\s*)?([A-Z][A-Za-z ]+\s+Deck)\s*$/m)?.[1];
  if (fromLine) return cleanText(fromLine);

  const fromUrl = sourceUrl.match(/\/([a-z]+(?:-[a-z]+)*-deck)(?:[/?#]|$)/i)?.[1];
  return fromUrl ? titleCaseSlug(fromUrl) : "";
}

function extractCodeBlocks(markdown) {
  return [...markdown.matchAll(/```(?:[^\n`]*)?\n?([\s\S]*?)```/g)].map((match) => match[1].trim());
}

function extractRouteHint(markdown) {
  for (const block of extractCodeBlocks(markdown)) {
    if (/==\s*ANTE\s+\d+\s*==/i.test(block)) continue;
    const hint = cleanText(block);
    if (hint.length > 20 && !/^SEED\b/i.test(hint) && !/^[A-Z0-9]{4,12}$/.test(hint)) {
      return hint;
    }
  }
  return "";
}

function normalizeQueueText(text) {
  let output = String(text || "").replace(/\r\n?/g, "\n");
  output = output.replace(/(==\s*ANTE\s+\d+\s*==)/gi, "\n$1\n");
  output = output.replace(/\s+(Boss|Voucher|Tags|Shop Queue|Packs)\s*:/gi, "\n$1:");
  output = output.replace(/\s+(\d+[).]\s+)/g, "\n$1");
  output = output.replace(new RegExp(`\\s+(${PACK_PATTERN})`, "gi"), "\n$1");
  return output;
}

function splitAnteSections(queueText) {
  const normalized = normalizeQueueText(queueText);
  const marker = /==\s*ANTE\s+(\d+)\s*==/gi;
  const matches = [...normalized.matchAll(marker)];
  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    return {
      ante: Number(match[1]),
      body: normalized.slice(start, end)
    };
  });
}

function splitTags(value) {
  return uniqueValues(cleanText(value).split(/[,/;，、·]+/).map(cleanText));
}

function stripListMarker(value) {
  return cleanText(value).replace(/^[-*]\s+/, "").replace(/^\d+[).]\s*/, "").trim();
}

function splitShopRest(value) {
  const rest = cleanText(value);
  if (!rest) return [];
  const numbered = [...rest.matchAll(/(?:^|\s)(\d+)[).]\s*([\s\S]*?)(?=(?:\s+\d+[).]\s*)|$)/g)]
    .map((match) => cleanText(match[2]))
    .filter(Boolean);
  if (numbered.length) return numbered;
  return rest.split(/,\s+(?=[A-Z0-9])/).map(cleanText).filter(Boolean);
}

function splitPackRest(value) {
  const rest = cleanText(value);
  if (!rest) return [];
  return rest
    .replace(new RegExp(`\\s+(${PACK_PATTERN})`, "gi"), "\n$1")
    .split(/\n+/)
    .map(stripListMarker)
    .filter(Boolean);
}

function parseQueueSection(section, routeHint, sourceId) {
  const table = {
    ante: section.ante,
    title: `Ante ${section.ante}`,
    boss: "",
    voucher: "",
    tags: [],
    routeUse: section.ante === 1 ? routeHint : "",
    shopQueue: [],
    packs: []
  };
  if (sourceId) table.sourceIds = [sourceId];

  let mode = "";
  const lines = normalizeQueueText(section.body)
    .split(/\n+/)
    .map(cleanText)
    .filter(Boolean);

  for (const line of lines) {
    let match = line.match(/^Boss\s*:\s*(.+)$/i);
    if (match) {
      table.boss = cleanText(match[1]);
      mode = "";
      continue;
    }

    match = line.match(/^Voucher\s*:\s*(.+)$/i);
    if (match) {
      table.voucher = cleanText(match[1]);
      mode = "";
      continue;
    }

    match = line.match(/^Tags\s*:\s*(.+)$/i);
    if (match) {
      table.tags = splitTags(match[1]);
      mode = "";
      continue;
    }

    match = line.match(/^Shop Queue\s*:\s*(.*)$/i);
    if (match) {
      mode = "shop";
      table.shopQueue.push(...splitShopRest(match[1]));
      continue;
    }

    match = line.match(/^Packs\s*:\s*(.*)$/i);
    if (match) {
      mode = "packs";
      table.packs.push(...splitPackRest(match[1]));
      continue;
    }

    if (/^\d+[).]\s+/.test(line) && mode !== "packs") {
      table.shopQueue.push(stripListMarker(line));
      mode = "shop";
      continue;
    }

    if (mode === "shop") {
      table.shopQueue.push(stripListMarker(line));
    } else if (mode === "packs") {
      table.packs.push(stripListMarker(line));
    }
  }

  table.tags = uniqueValues(table.tags);
  table.shopQueue = uniqueValues(table.shopQueue);
  table.packs = uniqueValues(table.packs);
  return table;
}

function extractQueueTables(markdown, sourceId) {
  const codeBlocks = extractCodeBlocks(markdown);
  const queueTexts = codeBlocks.some((block) => /==\s*ANTE\s+\d+\s*==/i.test(block))
    ? codeBlocks.filter((block) => /==\s*ANTE\s+\d+\s*==/i.test(block))
    : /==\s*ANTE\s+\d+\s*==/i.test(markdown)
      ? [markdown]
      : [];

  const routeHint = extractRouteHint(markdown);
  const seen = new Set();
  const tables = [];

  for (const text of queueTexts) {
    for (const section of splitAnteSections(text)) {
      if (seen.has(section.ante)) continue;
      const table = parseQueueSection(section, routeHint, sourceId);
      const hasUsefulContent = table.boss || table.voucher || table.tags.length || table.shopQueue.length || table.packs.length;
      if (hasUsefulContent) {
        seen.add(section.ante);
        tables.push(table);
      }
    }
  }

  return tables.sort((a, b) => a.ante - b.ante);
}

function actionPreview(prefix, values, limit) {
  const selected = values.slice(0, limit);
  if (!selected.length) return "";
  const suffix = values.length > limit ? `; +${values.length - limit} more` : "";
  return `${prefix}${selected.join(" -> ")}${suffix}`;
}

function buildFlowFromQueue(queueTables) {
  return queueTables.map((table) => {
    const actions = [
      table.tags.length ? `Tags: ${table.tags.join(", ")}` : "",
      table.voucher ? `Voucher: ${table.voucher}` : "",
      table.routeUse,
      actionPreview("Shop Queue key order: ", table.shopQueue, 6),
      actionPreview("Packs: ", table.packs, 3)
    ].filter(Boolean);

    if (!actions.length) {
      actions.push("Only raw queue metadata was extracted; replay decisions still need manual validation.");
    }

    return {
      stage: `Ante ${table.ante}${table.boss ? ` - ${table.boss}` : ""}`,
      actions
    };
  });
}

function removeCodeBlocks(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "\n");
}

function cleanProseLine(value) {
  return cleanText(value)
    .replace(/^[-*]\s+/, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "");
}

function extractProseFlow(markdown) {
  const body = removeCodeBlocks(markdown);
  const marker = /(?:^|\n)\s*(?:[-*]\s*)?(?:\*\*)?Ante\s+(\d+(?:\s*[-~]\s*\d+)?)(?:\*\*)?\s*[:：-]?\s*/gi;
  const matches = [...body.matchAll(marker)];
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    const stage = `Ante ${cleanText(match[1]).replace(/\s+/g, "")}`;
    const actions = body
      .slice(start, end)
      .split(/\n+/)
      .map(cleanProseLine)
      .filter((line) => line && !/^Title:|^URL Source:|^Markdown Content:/i.test(line))
      .slice(0, 6)
      .map((line) => (line.length > 180 ? `${line.slice(0, 177)}...` : line));

    return {
      stage,
      actions: actions.length ? actions : ["Prose route heading detected; action details need manual replay review."]
    };
  });
}

function extractSectionFlow(markdown) {
  const body = removeCodeBlocks(markdown);
  const marker = /(?:^|\n)\s*(?:#{2,6}\s*)?(?:\*\*)?(Blind|Shop|Continuation|Steps?|Route|Opening|Early Game|Mid Game|Late Game)(?:\*\*)?\s*[:：-]?\s*/gi;
  const matches = [...body.matchAll(marker)];
  if (!matches.length) return [];

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    const heading = cleanText(match[1]);
    const actions = body
      .slice(start, end)
      .split(/\n+/)
      .flatMap((line) => line.split(/(?<=\.)\s+(?=[A-Z])/))
      .map(cleanProseLine)
      .filter((line) => line && !/^Title:|^URL Source:|^Markdown Content:/i.test(line))
      .slice(0, 8)
      .map((line) => (line.length > 180 ? `${line.slice(0, 177)}...` : line));

    return {
      stage: heading,
      actions: actions.length ? actions : ["Section heading detected; action details need manual replay review."]
    };
  });
}

function buildWarnings(seedCandidates, selectedSeed) {
  const warnings = [];
  const distinct = uniqueValues(seedCandidates.map((candidate) => candidate.value));
  if (distinct.length > 1) {
    const candidateText = seedCandidates.map((candidate) => `${candidate.kind}=${candidate.value}`).join(", ");
    warnings.push(`Seed candidates differ (${candidateText}); selected ${selectedSeed}.`);
  }
  return warnings;
}

export function parseBalatroSeedMarkdown(markdown, options = {}) {
  const sourceUrl = extractSourceUrl(markdown, options.sourceUrl);
  const title = extractTitle(markdown);
  const seedCandidates = extractSeedCandidates(markdown, title, sourceUrl);
  const selectedSeed = seedCandidates.find((candidate) => candidate.kind === "body-seed-label")?.value
    || seedCandidates.find((candidate) => candidate.kind === "title")?.value
    || seedCandidates.find((candidate) => candidate.kind === "heading")?.value
    || seedCandidates.find((candidate) => candidate.kind === "url-slug")?.value
    || "";
  const deck = extractDeck(markdown, title, sourceUrl);
  const warnings = buildWarnings(seedCandidates, selectedSeed);
  const queueTables = extractQueueTables(markdown, options.sourceId);
  const flow = queueTables.length ? buildFlowFromQueue(queueTables) : extractProseFlow(markdown);
  const sectionFlow = flow.length ? flow : extractSectionFlow(markdown);
  const lastAnte = queueTables.at(-1)?.ante;

  const detail = {
    completeness: queueTables.length
      ? `Ante 1-${lastAnte} queue draft, replay decisions pending`
      : sectionFlow.length
        ? "Prose route draft, replay decisions pending"
        : "Raw page captured, route not parsed",
    sourceMode: "BalatroSeeds/Jina Reader extracted draft",
    videoStatus: "No video evidence in this extraction.",
    sources: options.sourceId ? [options.sourceId] : [],
    flow: sectionFlow.length
      ? sectionFlow
      : [
          {
            stage: "Route extraction pending",
            actions: ["No Ante queue block or prose Ante headings were detected in the captured page."]
          }
        ],
    mistakes: [
      "Treat this as extracted source material, not a proven optimal route.",
      ...warnings
    ]
  };
  if (queueTables.length) detail.queueTables = queueTables;

  return {
    seed: selectedSeed,
    deck,
    title,
    sourceUrl,
    parser: "extract-balatroseed-route",
    seedCandidates,
    warnings,
    detail
  };
}

function parseArgs(argv) {
  const args = {
    fixture: "",
    url: "",
    sourceId: "",
    dataRoot: "",
    timeoutMs: 30000,
    compact: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--fixture") args.fixture = argv[++index] || "";
    else if (arg === "--url") args.url = argv[++index] || "";
    else if (arg === "--source-id") args.sourceId = argv[++index] || "";
    else if (arg === "--data-root") args.dataRoot = argv[++index] || ".";
    else if (arg === "--timeout-ms") args.timeoutMs = Number(argv[++index] || 0);
    else if (arg === "--compact") args.compact = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive number");
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/extract-balatroseed-route.mjs --url https://balatroseeds.com/seeds/Y3QRZZ5I/yellow-deck --source-id balatroseeds-y3qrzz5i
  node scripts/extract-balatroseed-route.mjs --source-id balatroseeds-y3qrzz5i --data-root .
  node scripts/extract-balatroseed-route.mjs --url https://balatroseeds.com/seeds/Y3QRZZ5I/yellow-deck --timeout-ms 60000
  node scripts/extract-balatroseed-route.mjs --fixture scripts/fixtures/balatroseed-queue-sample.md
  cat page.md | node scripts/extract-balatroseed-route.mjs`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function readMarkdown(args) {
  if (args.fixture) {
    return {
      markdown: await fs.readFile(args.fixture, "utf8"),
      sourceUrl: args.url
    };
  }

  if (!args.url && args.sourceId && args.dataRoot) {
    args.url = await resolveSourceUrlFromDataRoot(args.sourceId, args.dataRoot);
  }

  if (args.url) {
    const readerUrl = toJinaReaderUrl(args.url);
    let readerError = null;
    let response;
    try {
      response = await fetch(readerUrl, {
        headers: { accept: "text/plain" },
        signal: AbortSignal.timeout(args.timeoutMs)
      });
    } catch (error) {
      const cause = error.cause?.code || error.cause?.message || error.message;
      readerError = `Jina Reader fetch failed for ${readerUrl}: ${cause}`;
    }
    if (response && !response.ok) {
      readerError = `Jina Reader fetch failed for ${readerUrl}: ${response.status} ${response.statusText}`;
    }
    if (response?.ok) {
      return {
        markdown: await response.text(),
        sourceUrl: args.url,
        readerUrl
      };
    }

    try {
      const directResponse = await fetch(args.url, {
        headers: { accept: "text/html,text/plain;q=0.9,*/*;q=0.8" },
        signal: AbortSignal.timeout(args.timeoutMs)
      });
      if (directResponse.ok) {
        const html = await directResponse.text();
        const markdown = htmlToMarkdownSnapshot(html, args.url);
        if (markdown) {
          return {
            markdown,
            sourceUrl: args.url,
            readerUrl,
            fallback: "html-meta"
          };
        }
      }
      readerError = `${readerError}; direct fetch failed for ${args.url}: ${directResponse.status} ${directResponse.statusText}`;
    } catch (error) {
      const cause = error.cause?.code || error.cause?.message || error.message;
      readerError = `${readerError}; direct fetch failed for ${args.url}: ${cause}`;
    }

    throw new Error(readerError);
  }

  if (process.stdin.isTTY) {
    printHelp();
    process.exitCode = 1;
    return { markdown: "" };
  }

  return {
    markdown: await readStdin(),
    sourceUrl: ""
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const input = await readMarkdown(args);
  if (!input.markdown) return;
  const parsed = parseBalatroSeedMarkdown(input.markdown, {
    sourceUrl: input.sourceUrl,
    sourceId: args.sourceId
  });
  if (input.readerUrl) parsed.readerUrl = input.readerUrl;
  if (input.fallback) parsed.readerFallback = input.fallback;
  console.log(JSON.stringify(parsed, null, args.compact ? 0 : 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
