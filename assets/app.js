const state = {
  data: null,
  query: "",
  archetype: "all",
  tag: "all"
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

function sourceLinks(sourceIds) {
  const fragment = document.createDocumentFragment();
  sourceIds.forEach((id, index) => {
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
    ...seed.route
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
}

async function boot() {
  const response = await fetch("assets/data/site-data.json");
  if (!response.ok) throw new Error(`Failed to load data: ${response.status}`);
  state.data = await response.json();

  $("#asOf").textContent = state.data.meta.asOf;
  renderStats();
  renderFilters();
  renderSeeds();
  renderStrategies();
  renderVideos();
  renderSignals();
  renderDomains();
  renderFutureGames();
  bindEvents();
}

boot().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML(
    "afterbegin",
    '<div class="domain-status" role="alert">数据加载失败，请刷新或检查 assets/data/site-data.json。</div>'
  );
});
