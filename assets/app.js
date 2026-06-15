const state = {
  data: null,
  routeData: null,
  query: "",
  archetype: "all",
  tag: "all",
  activeSeed: null
};

const formatNumber = new Intl.NumberFormat("zh-CN");

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function getSource(id) {
  return state.data.sources[id] || { label: id, url: "#" };
}

function getEvidence(id) {
  return (state.data.evidenceSources || []).find((item) => item.id === id) || null;
}

function sourceLinks(sourceIds) {
  const fragment = document.createDocumentFragment();
  (sourceIds || []).forEach((id, index) => {
    const source = getSource(id);
    const link = el("a", "source-link", index === 0 ? "来源" : `来源 ${index + 1}`);
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.title = source.label;
    fragment.append(link);
  });
  return fragment;
}

function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "external source";
  }
}

function renderRouteSources(sourceIds) {
  const box = $("#routeSources");
  const ids = [...new Set(sourceIds || [])];
  box.replaceChildren();

  if (!ids.length) {
    box.hidden = true;
    return;
  }

  box.hidden = false;
  box.append(el("h4", "", "来源证据"));
  const grid = el("div", "route-source-grid");
  ids.forEach((id) => {
    const source = getSource(id);
    const link = el("a", "route-source-card");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.append(el("span", "route-source-label", source.label || id));
    link.append(el("span", "route-source-host", sourceHost(source.url)));
    grid.append(link);
  });
  box.append(grid);
}

function mergeRouteData() {
  if (!state.routeData) return;

  state.data.sources = {
    ...state.data.sources,
    ...(state.routeData.sourceAdditions || {})
  };

  const existing = new Map(state.data.seeds.map((seed) => [seed.seed, seed]));
  (state.routeData.additionalSeeds || []).forEach((seed) => {
    if (!existing.has(seed.seed)) {
      state.data.seeds.push(seed);
      existing.set(seed.seed, seed);
    }
  });

  state.data.seeds.forEach((seed) => {
    seed.detail = state.routeData.seedDetails?.[seed.seed] || null;
  });

  const seedStat = state.data.stats.find((item) => item.label === "已整理种子");
  if (seedStat) {
    seedStat.value = String(state.data.seeds.length);
    seedStat.note = "含可点击牌局流程与待复盘队列";
  }
}

function renderStats() {
  const grid = $("#statsGrid");
  grid.replaceChildren(
    ...state.data.stats.map((item) => {
      const card = el("div", "stat-item");
      card.append(el("div", "stat-value", item.value));
      card.append(el("div", "stat-label", item.label));
      card.append(el("p", "stat-note", item.note));
      return card;
    })
  );
}

function renderFilters() {
  const archetypes = [...new Set(state.data.seeds.map((seed) => seed.archetype))].sort((a, b) =>
    a.localeCompare(b, "zh-CN")
  );
  const select = $("#archetypeFilter");
  archetypes.forEach((archetype) => {
    const option = el("option", "", archetype);
    option.value = archetype;
    select.append(option);
  });

  const tagCount = new Map();
  state.data.seeds.forEach((seed) => {
    seed.tags.forEach((tag) => tagCount.set(tag, (tagCount.get(tag) || 0) + 1));
  });
  const tags = [...tagCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"));
  const row = $("#tagFilters");
  row.append(createTagButton("all", "全部"));
  tags.slice(0, 18).forEach(([tag]) => row.append(createTagButton(tag, tag)));
}

function createTagButton(value, label) {
  const button = el("button", "tag-chip", label);
  button.type = "button";
  button.dataset.tag = value;
  button.addEventListener("click", () => {
    state.tag = value;
    renderSeeds();
  });
  return button;
}

function seedMatches(seed) {
  const query = state.query.trim().toLowerCase();
  const haystack = [
    seed.seed,
    seed.title,
    seed.deck,
    seed.archetype,
    seed.difficulty,
    seed.summary,
    ...seed.tags,
    ...seed.route,
    seed.detail?.completeness || "",
    ...(seed.detail?.flow || []).flatMap((stage) => [stage.stage, ...(stage.actions || [])])
  ]
    .join(" ")
    .toLowerCase();

  const queryMatch = !query || haystack.includes(query);
  const archetypeMatch = state.archetype === "all" || seed.archetype === state.archetype;
  const tagMatch = state.tag === "all" || seed.tags.includes(state.tag);
  return queryMatch && archetypeMatch && tagMatch;
}

function renderSeeds() {
  const grid = $("#seedGrid");
  const template = $("#seedCardTemplate");
  const seeds = state.data.seeds.filter(seedMatches);

  $("#resultCount").textContent = seeds.length;
  $$("#tagFilters .tag-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.tag === state.tag);
  });

  if (!seeds.length) {
    const empty = el("div", "signal-card");
    empty.append(el("h3", "", "没有匹配结果"));
    empty.append(el("p", "", "换一个种子代码、Joker 名称或标签试试。"));
    grid.replaceChildren(empty);
    return;
  }

  grid.replaceChildren(
    ...seeds.map((seed) => {
      const node = template.content.cloneNode(true);
      const article = $(".seed-card", node);
      $(".seed-card-image", node).src = seed.image;
      $(".seed-card-image", node).alt = `${seed.title} 封面图`;
      $(".seed-code", node).textContent = seed.seed;
      $("h3", node).textContent = seed.title;
      const badge = $(".flow-badge", node);
      badge.textContent = seed.detail?.completeness ? `流程：${seed.detail.completeness}` : "流程：待补";
      badge.dataset.status = seed.detail?.completeness || "待补";
      $(".seed-summary", node).textContent = seed.summary;
      $('[data-field="deck"]', node).textContent = seed.deck;
      $('[data-field="archetype"]', node).textContent = seed.archetype;
      $('[data-field="difficulty"]', node).textContent = seed.difficulty;

      const routeList = $(".route-list", node);
      seed.route.forEach((step) => routeList.append(el("li", "", step)));

      const tags = $(".tag-list", node);
      seed.tags.forEach((tag) => tags.append(el("span", "seed-tag", tag)));

      const sources = $(".source-list", node);
      sources.append(sourceLinks(seed.sources));

      const detailButton = $(".detail-button", node);
      detailButton.addEventListener("click", () => showRoute(seed, true));

      article.classList.toggle("has-flow", Boolean(seed.detail));
      article.addEventListener("click", (event) => {
        if (event.target.closest("button, a")) return;
        showRoute(seed, true);
      });

      const copy = $(".copy-button", node);
      copy.addEventListener("click", async () => {
        copy.textContent = "已复制";
        await copySeed(seed.seed);
        window.setTimeout(() => {
          copy.textContent = "复制";
        }, 1200);
      });

      return article;
    })
  );
}

function showRoute(seed, shouldScroll = false) {
  state.activeSeed = seed.seed;
  const viewer = $("#routeViewer");
  const detail = seed.detail || {
    completeness: "待补",
    sourceMode: "暂无可读流程",
    videoStatus: "",
    flow: [
      {
        stage: "待补流程",
        actions: ["这个种子目前只有摘要，还没有抓到可复现的逐阶段路线。"]
      }
    ],
    mistakes: ["不要把只有标题或热度的种子当作完整攻略。"]
  };

  $("#routeTitle").textContent = `${seed.seed} · ${seed.title}`;
  $("#routeSubtitle").textContent = seed.summary;

  const metaItems = [
    ["完整度", detail.completeness || "待补"],
    ["牌组", seed.deck],
    ["流派", seed.archetype],
    ["来源状态", detail.sourceMode || "来源待补"]
  ];
  if (detail.videoStatus) metaItems.push(["视频/字幕", detail.videoStatus]);
  $("#routeMeta").replaceChildren(
    ...metaItems.map(([label, value]) => {
      const item = el("div", "route-meta-item");
      item.append(el("span", "", label));
      item.append(el("strong", "", value));
      return item;
    })
  );

  $("#routeFlow").replaceChildren(
    ...(detail.flow || []).map((stage) => {
      const node = el("section", "flow-stage");
      const body = el("div");
      body.append(el("h4", "", stage.stage));
      const list = el("ul");
      (stage.actions || []).forEach((line) => list.append(el("li", "", line)));
      body.append(list);
      node.append(body);
      return node;
    })
  );

  const mistakeBox = $("#routeMistakes");
  mistakeBox.replaceChildren();
  const mistakes = detail.mistakes || seed.warnings || [];
  if (mistakes.length) {
    mistakeBox.append(el("h4", "", "常见坑 / 复盘备注"));
    const list = el("ul");
    mistakes.forEach((line) => list.append(el("li", "", line)));
    mistakeBox.append(list);
    mistakeBox.hidden = false;
  } else {
    mistakeBox.hidden = true;
  }

  const sourceIds = [...new Set([...(seed.sources || []), ...(detail.sources || [])])];
  renderRouteSources(sourceIds);
  viewer.hidden = false;
  if (shouldScroll) {
    history.replaceState(null, "", `#seed-${seed.seed}`);
    viewer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function maybeOpenRouteFromHash() {
  const match = decodeURIComponent(window.location.hash).match(/^#seed-(.+)$/);
  if (!match) return;
  const seed = state.data.seeds.find((item) => item.seed.toLowerCase() === match[1].toLowerCase());
  if (seed) showRoute(seed, true);
}

async function copySeed(seed) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(seed);
      return;
    } catch {
      // Browser permission policies can block Clipboard API in automated checks.
    }
  }
  const input = document.createElement("textarea");
  input.value = seed;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  try {
    document.execCommand("copy");
  } catch {
    // The UI still exposes the seed value and gives immediate feedback.
  }
  input.remove();
}

function renderStrategies() {
  const grid = $("#strategyGrid");
  grid.replaceChildren(
    ...state.data.strategies.map((item) => {
      const card = el("article", "strategy-card");
      const image = el("img");
      image.src = item.image;
      image.alt = `${item.title} 封面图`;
      const content = el("div", "strategy-content");
      content.append(el("h3", "", item.title));
      content.append(el("p", "", item.body));
      const list = el("ul");
      item.checklist.forEach((line) => list.append(el("li", "", line)));
      content.append(list);
      const sources = el("div", "source-list");
      sources.append(sourceLinks(item.sources));
      content.append(sources);
      card.append(image, content);
      return card;
    })
  );
}

function renderVideos() {
  const rows = $("#videoRows");
  rows.replaceChildren(
    ...state.data.videos.map((video) => {
      const tr = document.createElement("tr");
      tr.append(el("td", "", video.topic));
      const title = el("td");
      const link = el("a", "plain-link", video.title);
      link.href = video.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      title.append(link);
      title.append(el("div", "stat-note", `${video.platform} · ${video.author}`));
      tr.append(title);
      tr.append(el("td", "metric", formatNumber.format(video.views)));
      tr.append(el("td", "metric", video.favorites ? formatNumber.format(video.favorites) : "未取到"));
      tr.append(el("td", "", video.platform));
      return tr;
    })
  );
}

function renderPlatformStatus() {
  const grid = $("#platformStatus");
  if (!grid) return;
  const platforms = state.data.platformStatus || [];

  if (!platforms.length) {
    const empty = el("div", "signal-card");
    empty.append(el("h3", "", "平台状态待补"));
    empty.append(el("p", "", "当前数据文件还没有 platformStatus 字段。"));
    grid.replaceChildren(empty);
    return;
  }

  grid.replaceChildren(
    ...platforms.map((item) => {
      const card = el("article", "platform-card");
      const top = el("div", "platform-card-top");
      top.append(el("h3", "", item.platform));
      const status = el("span", "status-pill", item.status);
      status.dataset.usable = item.usableNow ? "true" : "false";
      top.append(status);
      card.append(top);

      const access = el("p", "platform-line");
      access.append(el("strong", "", "接入："));
      access.append(document.createTextNode(item.accessMethod || "待补"));
      card.append(access);

      const limit = el("p", "platform-line");
      limit.append(el("strong", "", "限制："));
      limit.append(document.createTextNode(item.limitation || "暂无"));
      card.append(limit);

      const next = el("p", "platform-next", item.nextAction || "等待后续接入。");
      card.append(next);
      return card;
    })
  );
}

function renderEvidenceSources() {
  const grid = $("#evidenceSources");
  if (!grid) return;
  const evidence = state.data.evidenceSources || [];

  if (!evidence.length) {
    const empty = el("div", "signal-card");
    empty.append(el("h3", "", "证据池待补"));
    empty.append(el("p", "", "当前数据文件还没有 evidenceSources 字段。"));
    grid.replaceChildren(empty);
    return;
  }

  grid.replaceChildren(
    ...evidence.map((item) => {
      const card = el("article", "evidence-card");
      const meta = el("div", "evidence-meta");
      meta.append(el("span", "", item.platform || "未知平台"));
      const confidence = el("span", "confidence-pill", item.confidence || "待定");
      confidence.dataset.confidence = item.confidence || "待定";
      meta.append(confidence);
      card.append(meta);

      const title = el("h3");
      const link = el("a", "", item.title || item.id);
      link.href = item.url || "#";
      link.target = "_blank";
      link.rel = "noreferrer";
      title.append(link);
      card.append(title);

      const seeds = item.seeds || [];
      if (seeds.length) {
        const seedRow = el("div", "evidence-seeds");
        seeds.forEach((seed) => seedRow.append(el("span", "seed-tag", seed)));
        card.append(seedRow);
      }

      const facts = el("ul", "evidence-facts");
      (item.facts || []).forEach((fact) => facts.append(el("li", "", fact)));
      card.append(facts);

      if (item.useInSite) {
        const use = el("p", "evidence-use");
        use.append(el("strong", "", "站内用途："));
        use.append(document.createTextNode(item.useInSite));
        card.append(use);
      }

      const footer = el("div", "evidence-foot");
      footer.append(el("span", "", item.contentType || "来源"));
      footer.append(el("span", "", item.retrievedAt || state.data.meta.asOf));
      card.append(footer);
      return card;
    })
  );
}

function renderReviewQueue() {
  const grid = $("#reviewQueue");
  if (!grid) return;
  const queue = state.data.reviewQueue || [];

  if (!queue.length) {
    const empty = el("div", "signal-card");
    empty.append(el("h3", "", "复盘队列待补"));
    empty.append(el("p", "", "当前数据文件还没有 reviewQueue 字段。"));
    grid.replaceChildren(empty);
    return;
  }

  grid.replaceChildren(
    ...queue.map((item) => {
      const card = el("article", "queue-card");
      card.dataset.priority = item.priority || "";
      card.dataset.status = item.status || "";

      const top = el("div", "queue-card-top");
      const titleBox = el("div");
      titleBox.append(el("span", "queue-platform", item.platform || "未分平台"));
      titleBox.append(el("h3", "", item.title || item.id));
      top.append(titleBox);

      const pills = el("div", "queue-pills");
      const priority = el("span", "queue-priority", item.priority || "P");
      priority.dataset.priority = item.priority || "";
      pills.append(priority);
      const status = el("span", "queue-status", item.status || "待定");
      status.dataset.status = item.status || "";
      pills.append(status);
      top.append(pills);
      card.append(top);

      const meta = el("div", "queue-meta");
      meta.append(el("span", "", item.ownerMode || "待分派"));
      meta.append(el("span", "", item.updatedAt || state.data.meta.asOf));
      card.append(meta);

      if ((item.targetSeeds || []).length) {
        const seeds = el("div", "queue-seeds");
        item.targetSeeds.forEach((seed) => seeds.append(el("span", "seed-tag", seed)));
        card.append(seeds);
      }

      if (item.blocker) {
        const blocker = el("p", "queue-blocker");
        blocker.append(el("strong", "", "阻塞："));
        blocker.append(document.createTextNode(item.blocker));
        card.append(blocker);
      }

      const next = el("p", "queue-action");
      next.append(el("strong", "", "下一步："));
      next.append(document.createTextNode(item.nextAction || "待补"));
      card.append(next);

      const validation = el("p", "queue-validation");
      validation.append(el("strong", "", "验收："));
      validation.append(document.createTextNode(item.validation || "待补"));
      card.append(validation);

      if ((item.evidenceIds || []).length) {
        const evidenceBox = el("div", "queue-evidence");
        evidenceBox.append(el("span", "queue-evidence-label", "证据"));
        const links = el("div", "queue-evidence-links");
        item.evidenceIds.forEach((id) => {
          const evidence = getEvidence(id);
          const link = el("a", "queue-evidence-link", evidence?.title || id);
          link.href = evidence?.url || "#";
          link.target = "_blank";
          link.rel = "noreferrer";
          link.title = evidence?.platform || id;
          links.append(link);
        });
        evidenceBox.append(links);
        card.append(evidenceBox);
      }

      if ((item.sourceIds || []).length) {
        const sourceBox = el("div", "queue-source-list");
        sourceBox.append(sourceLinks(item.sourceIds));
        card.append(sourceBox);
      }

      return card;
    })
  );
}

function renderSignals() {
  const grid = $("#siteSignals");
  grid.replaceChildren(
    ...state.data.sites.map((site) => {
      const card = el("article", "signal-card");
      card.append(el("div", "card-meta", site.type));
      const title = el("h3");
      const link = el("a", "", site.name);
      link.href = site.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      title.append(link);
      card.append(title);
      card.append(el("p", "", site.signal));
      card.append(el("p", "", `机会：${site.opportunity}`));
      return card;
    })
  );
}

function renderDomains() {
  const grid = $("#domainGrid");
  grid.replaceChildren(
    ...state.data.domains.map((domain) => {
      const card = el("article", "domain-card");
      card.append(el("span", "priority", domain.priority));
      card.append(el("h3", "", domain.domain));
      card.append(el("p", "", domain.fit));
      card.append(el("div", "domain-status", domain.status));
      return card;
    })
  );
}

function renderFutureGames() {
  const grid = $("#futureGrid");
  grid.replaceChildren(
    ...state.data.futureGames.map((game) => {
      const card = el("article", "future-card");
      const badge = el("span", "priority", `${game.priority} 级`);
      badge.dataset.priority = game.priority;
      card.append(badge);
      card.append(el("h3", "", game.name));
      card.append(el("p", "", game.why));
      const list = el("ul");
      game.contentAngles.forEach((angle) => list.append(el("li", "", angle)));
      card.append(list);
      const sources = el("div", "source-list");
      sources.append(sourceLinks(game.sources));
      card.append(sources);
      return card;
    })
  );
}

function bindEvents() {
  $("#seedSearch").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderSeeds();
  });

  $("#archetypeFilter").addEventListener("change", (event) => {
    state.archetype = event.target.value;
    renderSeeds();
  });

  $("#resetFilters").addEventListener("click", () => {
    state.query = "";
    state.archetype = "all";
    state.tag = "all";
    $("#seedSearch").value = "";
    $("#archetypeFilter").value = "all";
    renderSeeds();
  });

  $("#closeRouteViewer").addEventListener("click", () => {
    state.activeSeed = null;
    $("#routeViewer").hidden = true;
    history.replaceState(null, "", "#seeds");
  });

  window.addEventListener("hashchange", maybeOpenRouteFromHash);
}

async function boot() {
  const [siteResponse, routeResponse] = await Promise.all([
    fetch("assets/data/site-data.json"),
    fetch("assets/data/route-data.json")
  ]);
  if (!siteResponse.ok) throw new Error(`Failed to load data: ${siteResponse.status}`);
  if (!routeResponse.ok) throw new Error(`Failed to load route data: ${routeResponse.status}`);
  state.data = await siteResponse.json();
  state.routeData = await routeResponse.json();
  mergeRouteData();

  $("#asOf").textContent = state.data.meta.asOf;
  renderStats();
  renderFilters();
  renderSeeds();
  renderStrategies();
  renderVideos();
  renderPlatformStatus();
  renderEvidenceSources();
  renderReviewQueue();
  renderSignals();
  renderDomains();
  renderFutureGames();
  bindEvents();
  maybeOpenRouteFromHash();
}

boot().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML(
    "afterbegin",
    '<div class="domain-status" role="alert">数据加载失败，请刷新或检查 assets/data/site-data.json。</div>'
  );
});
