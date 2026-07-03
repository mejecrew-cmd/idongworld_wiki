const DATA_PATHS = {
  pages: "./src/data/pages.json",
  strings: "./src/data/strings.csv",
  locales: "./src/data/locales.json"
};

const app = document.querySelector("#app");
let pages = [];
let strings = new Map();
let locales = [];
// 언어는 위키 공유 상단바(localStorage "idw_lang")를 따른다. 콘텐츠는 ko 우선 폴백.
let activeLocale = (window.IDWLang && IDWLang.lang && IDWLang.lang())
  || localStorage.getItem("idw_lang")
  || localStorage.getItem("idong_locale")
  || "ko";

init().catch((error) => {
  console.error(error);
  app.innerHTML = `<div class="empty-state">아이동월드 기록을 불러오지 못했습니다.</div>`;
});

async function init() {
  const [pagesJson, stringsText, localesJson] = await Promise.all([
    fetch(DATA_PATHS.pages).then((response) => response.json()),
    fetch(DATA_PATHS.strings).then((response) => response.text()),
    fetch(DATA_PATHS.locales).then((response) => response.json())
  ]);

  pages = pagesJson;
  strings = buildStringMap(parseCsv(stringsText));
  locales = localesJson;
  normalizeActiveLocale();

  // 통일 상단바에서 언어 변경 시 재렌더 (콘텐츠 미보유 언어는 ko 폴백)
  if (window.IDWLang && IDWLang.onChange) {
    IDWLang.onChange((code) => {
      activeLocale = locales.some((l) => l.code === code) ? code : "ko";
      render();
    });
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  render();
}

function render() {
  syncLocaleFromRouteQuery();
  applyLocaleDocumentState();
  const route = currentRoute();

  if (route === "/language") {
    applyPageTheme(null);
    renderLanguagePage();
    return;
  }

  if (route === "/contents") {
    applyPageTheme(null);
    renderContentsPage();
    return;
  }

  const page = findPageByRoute(route) || findPageById("p00_01");
  applyPageTheme(page);
  app.innerHTML = renderTopNav(page) + renderPage(page);
  wireTopNav(page);
  polishTypography();
  updateReadingProgress();
}

// 구역/화풍 변주 테마를 phone-frame(#app)에 부여 → frame/zones/kpop-fx 레이어가 물든다.
// 화풍_변주(페이지구성표): 야경→night, 물→water, 안개→fog, 무대→stage, 없음→해제.
const VARIANT_MAP = {
  "야경": "night", "야경/등불": "night", "등불": "night", "night": "night",
  "물": "water", "물/반사": "water", "반사": "water", "water": "water",
  "안개": "fog", "안개/고지": "fog", "고지": "fog", "fog": "fog",
  "무대": "stage", "무대/축하": "stage", "축하": "stage", "stage": "stage"
};

function applyPageTheme(page) {
  const zone = page && page.zone ? String(page.zone).padStart(2, "0") : "";
  const rawVariant = page && page.variant ? String(page.variant) : "";
  const variant = VARIANT_MAP[rawVariant] || (rawVariant === "없음" ? "" : rawVariant);

  if (zone) app.setAttribute("data-zone", zone);
  else app.removeAttribute("data-zone");

  if (variant) app.setAttribute("data-variant", variant);
  else app.removeAttribute("data-variant");
}

function currentHashParts() {
  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  const [route, query = ""] = hash.split("?");
  return {
    route: route || "/",
    params: new URLSearchParams(query)
  };
}

function currentRoute() {
  return currentHashParts().route;
}

function go(route) {
  window.location.hash = route;
}

function normalizeActiveLocale() {
  if (!locales.some((locale) => locale.code === activeLocale)) {
    activeLocale = locales[0]?.code || "ko";
    localStorage.setItem("idong_locale", activeLocale);
  }
}

function syncLocaleFromRouteQuery() {
  const requestedLocale = currentHashParts().params.get("lang");
  if (!requestedLocale || requestedLocale === activeLocale) return;
  if (!locales.some((locale) => locale.code === requestedLocale)) return;

  activeLocale = requestedLocale;
  localStorage.setItem("idong_locale", activeLocale);
}

function findPageByRoute(route) {
  return pages.find((page) => page.route === route);
}

function findPageById(pageId) {
  if (!pageId) return null;
  return pages.find((page) => page.page_id === pageId);
}

function t(key) {
  if (!key) return "";
  const row = strings.get(key);
  if (!row) return key;
  return row[activeLocale] || row.ko || key;
}

function currentLocale() {
  return locales.find((locale) => locale.code === activeLocale) || locales[0];
}

function applyLocaleDocumentState() {
  const locale = currentLocale();
  document.documentElement.lang = activeLocale;
  document.documentElement.dir = locale?.direction || "ltr";
  document.body.style.fontFamily = locale?.font_stack || "";
}

function renderTopNav(page) {
  const depth = page?.depth?.map((item) => t(item.label_key)).filter(Boolean).join(" · ") || t("nav.home");
  return `
    <nav class="top-nav" aria-label="기록 탐색">
      <button class="icon-button" type="button" data-action="back" aria-label="${escapeHtml(t("nav.back"))}" title="${escapeHtml(t("nav.back"))}">
        ${icon("back")}
      </button>
      <button class="icon-button" type="button" data-action="contents" aria-label="${escapeHtml(t("nav.contents"))}" title="${escapeHtml(t("nav.contents"))}">
        ${icon("contents")}
      </button>
      <div class="depth-label">${escapeHtml(depth)}</div>
      <div aria-hidden="true"></div>
      <div class="reading-progress" aria-hidden="true"><span class="reading-progress-bar"></span></div>
    </nav>
  `;
}

function wireTopNav(page) {
  app.querySelector("[data-action='back']")?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    const parentPage = findPageById(page?.nav?.parent_id);
    if (page?.nav?.parent_route) {
      go(page.nav.parent_route);
      return;
    }
    const fallback = parentPage || findPageById(page?.nav?.back_fallback_id) || findPageById("p00_01");
    go(fallback.route);
  });

  app.querySelector("[data-action='language']")?.addEventListener("click", () => {
    go("/language");
  });

  app.querySelector("[data-action='contents']")?.addEventListener("click", () => {
    go("/contents");
  });
}

function renderPage(page) {
  if (page.template === "section_index") {
    return renderSectionIndex(page);
  }

  return renderArticle(page, page.template === "cover");
}

function renderArticle(page, isCover = false) {
  return `
    <article class="page ${isCover ? "cover" : "article"}">
      ${renderHeader(page)}
      ${renderHero(page)}
      <section class="content">
        ${page.body_blocks.map(renderBlock).join("")}
      </section>
      ${renderChildToc(page)}
      ${renderRelated(page)}
      ${renderPager(page)}
    </article>
  `;
}

function renderSectionIndex(page) {
  return `
    <article class="page section-index">
      ${renderHeader(page)}
      ${renderHero(page)}
      <section class="content">
        ${page.body_blocks.map(renderBlock).join("")}
      </section>
      ${renderChildToc(page)}
      ${renderRelated(page)}
      ${renderPager(page)}
    </article>
  `;
}

function renderChildToc(page) {
  const childPages = (page.children || []).map(findPageById).filter(Boolean);
  if (!childPages.length) return "";

  return `
    <section class="toc-panel" aria-labelledby="${escapeAttr(page.page_id)}-toc-title">
      <div class="toc-header">
        <h2 id="${escapeAttr(page.page_id)}-toc-title" class="toc-title">${escapeHtml(t("contents.chapter_items"))}</h2>
        <span class="contents-count">${escapeHtml(t("contents.count").replace("{count}", childPages.length))}</span>
      </div>
      <p class="toc-note">${escapeHtml(t("contents.child_note"))}</p>
      <ul class="toc-list is-detailed">
        ${childPages.map(renderTocItem).join("")}
      </ul>
    </section>
  `;
}

function renderTocItem(child) {
  const summary = child.header.summary_keys?.[0] ? t(child.header.summary_keys[0]) : t(child.header.category_key);
  return `
    <li>
      <a class="toc-link toc-link-detailed" href="#${child.route}">
        <span class="toc-link-main">
          <strong>${escapeHtml(t(child.header.title_key))}</strong>
          <span>${escapeHtml(summary)}</span>
        </span>
        <span class="status-pill">${escapeHtml(t(`status.${child.status || "draft"}`))}</span>
      </a>
    </li>
  `;
}

function renderContentsPage() {
  const pageLike = {
    depth: [
      { label_key: "nav.home", route: "/" },
      { label_key: "contents.title", route: "/contents" }
    ],
    nav: { back_fallback_id: "p00_01", parent_id: "p00_01" }
  };

  applyLocaleDocumentState();
  const groups = groupPagesByChapter();
  const totalPages = pages.length;
  app.innerHTML = `
    ${renderTopNav(pageLike)}
    <article class="page contents-page">
      <header class="article-header">
        <div class="category">${escapeHtml(t("nav.contents"))}</div>
        <h1 class="title">${escapeHtml(t("contents.title"))}</h1>
        <p class="summary">
          <span class="summary-line">${escapeHtml(t("contents.note"))}</span>
          <span class="summary-line">${escapeHtml(t("contents.total").replace("{count}", totalPages))}</span>
        </p>
      </header>
      <section class="contents-panel">
        <label class="contents-search-label" for="contents-search">${escapeHtml(t("contents.search_label"))}</label>
        <input id="contents-search" class="contents-search" type="search" placeholder="${escapeAttr(t("contents.search_placeholder"))}" data-action="contents-search" />
        <div class="contents-groups" data-contents-groups>
          ${groups.map(renderContentsGroup).join("")}
        </div>
        <p class="contents-empty" data-contents-empty hidden>${escapeHtml(t("contents.empty"))}</p>
      </section>
    </article>
  `;

  wireTopNav(pageLike);
  wireContentsSearch();
  polishTypography();
  updateReadingProgress();
}

function groupPagesByChapter() {
  const groups = [];
  const sectionPages = pages
    .filter((page) => page.template === "section_index")
    .sort((a, b) => a.section.chapter_no - b.section.chapter_no);

  const coverChildren = pages.filter((page) => page.section.chapter_no === 0 && page.page_id !== "p00_01");
  groups.push({
    chapterNo: 0,
    title: t("s00.title"),
    pages: [findPageById("p00_01"), ...coverChildren].filter(Boolean)
  });

  sectionPages.forEach((sectionPage) => {
    groups.push({
      chapterNo: sectionPage.section.chapter_no,
      title: t(sectionPage.section.title_key),
      pages: [sectionPage, ...(sectionPage.children || []).map(findPageById).filter(Boolean)]
    });
  });

  return groups;
}

function renderContentsGroup(group) {
  return `
    <section class="contents-group" data-contents-group>
      <h2 class="contents-group-title">
        <span>${escapeHtml(group.title)}</span>
        <span class="contents-count">${escapeHtml(t("contents.count").replace("{count}", group.pages.length))}</span>
      </h2>
      <ul class="contents-list">
        ${group.pages.map(renderContentsLink).join("")}
      </ul>
    </section>
  `;
}

function renderContentsLink(page) {
  const title = t(page.header.title_key);
  const category = t(page.header.category_key);
  const searchText = normalizeSearchText(`${page.page_id} ${title} ${category} ${page.route}`);
  return `
    <li data-contents-item data-search="${escapeAttr(searchText)}">
      <a class="contents-link" href="#${page.route}">
        <span class="contents-link-main">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(category)}</span>
        </span>
        <span class="status-pill">${escapeHtml(t(`status.${page.status || "draft"}`))}</span>
      </a>
    </li>
  `;
}

function wireContentsSearch() {
  const input = app.querySelector("[data-action='contents-search']");
  const items = Array.from(app.querySelectorAll("[data-contents-item]"));
  const groups = Array.from(app.querySelectorAll("[data-contents-group]"));
  const empty = app.querySelector("[data-contents-empty]");
  if (!input) return;

  input.addEventListener("input", () => {
    const query = normalizeSearchText(input.value);
    let visibleCount = 0;
    items.forEach((item) => {
      const matched = !query || item.dataset.search.includes(query);
      item.hidden = !matched;
      if (matched) visibleCount += 1;
    });
    groups.forEach((group) => {
      const visibleItems = Array.from(group.querySelectorAll("[data-contents-item]")).some((item) => !item.hidden);
      group.hidden = !visibleItems;
    });
    if (empty) empty.hidden = visibleCount > 0;
  });
}

function normalizeSearchText(value) {
  return String(value || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function polishTypography(root = app) {
  if (activeLocale !== "ko") return;
  const selector = [
    ".title",
    ".category",
    ".summary-line",
    ".paragraph",
    ".content-heading",
    ".quote",
    ".callout-title",
    ".callout p",
    ".box-title",
    ".field-row dt",
    ".field-row dd",
    ".hero-caption",
    ".toc-title",
    ".toc-note",
    ".toc-link-main strong",
    ".toc-link-main span",
    ".contents-group-title span:first-child",
    ".contents-link-main strong",
    ".contents-link-main span",
    ".related-link span:first-child",
    ".pager-title",
    ".codex-card h3",
    ".codex-card p",
    ".timeline-list h3",
    ".timeline-list p",
    ".image-pair-card figcaption strong",
    ".image-pair-card figcaption span"
  ].join(",");

  root.querySelectorAll(selector).forEach((element) => {
    if (element.children.length) return;
    element.textContent = protectKoreanEnding(element.textContent);
  });
}

function protectKoreanEnding(value) {
  return String(value || "").replace(/(\S+)\s+([가-힣A-Za-z0-9]{1,2})([.!?。！？…]*)$/u, "$1\u00A0$2$3");
}

function renderHeader(page) {
  const summaries = page.header.summary_keys || [];
  return `
    <header class="article-header">
      <div class="category">${escapeHtml(t(page.header.category_key))}</div>
      <h1 class="title">${escapeHtml(t(page.header.title_key))}</h1>
      ${renderMeta(page)}
      <p class="summary">
        ${summaries.map((key) => `<span class="summary-line">${escapeHtml(t(key))}</span>`).join("")}
      </p>
    </header>
  `;
}

function renderMeta(page) {
  if (!page.meta) return "";
  const items = [page.meta.read_time_key, page.meta.updated_key].filter(Boolean).map((key) => t(key)).filter(Boolean);
  if (!items.length) return "";
  return `<div class="article-meta">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`;
}

function renderHero(page) {
  if (!page.hero?.src) return "";
  const heroStyle = heroInlineStyle(page.hero);
  return `
    <figure class="hero">
      <img class="hero-image" src="${escapeAttr(page.hero.src)}" alt="${escapeAttr(t(page.hero.alt_key))}" style="${escapeAttr(heroStyle)}" />
      <figcaption class="hero-caption">${escapeHtml(t(page.hero.caption_key))}</figcaption>
    </figure>
  `;
}

function heroInlineStyle(hero) {
  const style = [
    `--hero-aspect-ratio: ${normalizeAspectRatio(hero.aspect_ratio)}`,
    `--hero-focal-point: ${sanitizeCssValue(hero.focal_point || "center")}`
  ];

  return style.join("; ");
}

function normalizeAspectRatio(value) {
  const match = String(value || "16:9").match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match) return "16 / 9";
  return `${match[1]} / ${match[2]}`;
}

function sanitizeCssValue(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9.% -]/g, "")
    .trim() || "center";
}

// 인라인 마크다운(**볼드**, *이탤릭*)만 최소 지원 — 나머지는 escapeHtml 안전.
function fmt(key) {
  return escapeHtml(t(key))
    .replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
}

function renderBlock(block) {
  if (block.type === "paragraph") {
    return `<p class="paragraph">${fmt(block.text_key)}</p>`;
  }

  if (block.type === "subheading") {
    return `<h2 class="content-heading">${escapeHtml(t(block.text_key))}</h2>`;
  }

  if (block.type === "quote") {
    return `<blockquote class="quote">${fmt(block.text_key)}</blockquote>`;
  }

  if (block.type === "callout") {
    return `
      <aside class="callout">
        <h2 class="callout-title">${escapeHtml(t(block.title_key))}</h2>
        <p>${fmt(block.text_key)}</p>
      </aside>
    `;
  }

  if (block.type === "list") {
    return `
      <section class="article-list">
        <h2 class="box-title">${escapeHtml(t(block.title_key))}</h2>
        <ul>
          ${(block.items || []).map((key) => `<li>${fmt(key)}</li>`).join("")}
        </ul>
      </section>
    `;
  }

  if (block.type === "data_box") {
    return `
      <aside class="data-box">
        <h2 class="box-title">${escapeHtml(t(block.title_key))}</h2>
        <dl class="field-list">
          ${(block.items || []).map((item) => `
            <div class="field-row">
              <dt>${fmt(item.label_key)}</dt>
              <dd>${fmt(item.value_key)}</dd>
            </div>
          `).join("")}
        </dl>
      </aside>
    `;
  }

  if (block.type === "codex_grid") {
    return `
      <section class="codex-grid-panel">
        <h2 class="box-title">${escapeHtml(t(block.title_key))}</h2>
        <div class="codex-grid">
          ${(block.items || []).map((item) => `
            <article class="codex-card ${item.state ? `is-${escapeAttr(item.state)}` : ""}">
              <div class="codex-mark" aria-hidden="true"></div>
              <h3>${fmt(item.label_key)}</h3>
              <p>${fmt(item.text_key)}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  if (block.type === "timeline") {
    return `
      <section class="timeline-panel">
        <h2 class="box-title">${escapeHtml(t(block.title_key))}</h2>
        <ol class="timeline-list">
          ${(block.items || []).map((item) => `
            <li>
              <span class="timeline-dot" aria-hidden="true"></span>
              <div>
                <h3>${escapeHtml(t(item.label_key))}</h3>
                <p>${escapeHtml(t(item.text_key))}</p>
              </div>
            </li>
          `).join("")}
        </ol>
      </section>
    `;
  }

  if (block.type === "image_pair") {
    return `
      <section class="image-pair">
        <h2 class="box-title">${escapeHtml(t(block.title_key))}</h2>
        <div class="image-pair-grid">
          ${(block.items || []).map((item) => `
            <figure class="image-pair-card">
              <img src="${escapeAttr(item.src)}" alt="${escapeAttr(t(item.alt_key))}" />
              <figcaption>
                <strong>${escapeHtml(t(item.label_key))}</strong>
                <span>${escapeHtml(t(item.caption_key))}</span>
              </figcaption>
            </figure>
          `).join("")}
        </div>
      </section>
    `;
  }

  return "";
}

function renderRelated(page) {
  const items = page.related_items || [];
  if (!items.length) return "";

  return `
    <section class="related" aria-labelledby="related-title">
      <h2 id="related-title" class="related-title">${escapeHtml(t("related.title"))}</h2>
      <ul class="related-list">
        ${items.map(renderRelatedItem).join("")}
      </ul>
    </section>
  `;
}

function renderRelatedItem(item) {
  if (item.type === "page") {
    const target = findPageById(item.page_id);
    const href = target ? `#${target.route}` : "#/";
    return `
      <li>
        <a class="related-link" href="${href}">
          <span>${escapeHtml(t(item.label_key))}</span>
          <span class="related-type">${escapeHtml(t("related.page"))}</span>
        </a>
      </li>
    `;
  }

  return `
    <li>
      <a class="related-link" href="#/language">
        <span>${escapeHtml(t(item.label_key))}</span>
        <span class="related-type">${escapeHtml(t("related.term"))}</span>
      </a>
    </li>
  `;
}

function renderPager(page) {
  const prev = pagerTargetFromPage(findPageById(page.nav?.prev_id));
  const parent = page.nav?.parent_route
    ? { route: page.nav.parent_route, title: t(page.nav.parent_label_key || "nav.parent") }
    : pagerTargetFromPage(findPageById(page.nav?.parent_id));
  const next = pagerTargetFromPage(findPageById(page.nav?.next_id));

  return `
    <nav class="pager" aria-label="기록 이동">
      ${pagerLink(prev, "nav.previous", "nav.no_previous")}
      ${pagerLink(parent, "nav.parent", "nav.parent")}
      ${pagerLink(next, "nav.next", "nav.no_next")}
    </nav>
  `;
}

function pagerTargetFromPage(page) {
  if (!page) return null;
  return { route: page.route, title: t(page.header.title_key) };
}

function pagerLink(target, kickerKey, emptyKey) {
  if (!target) {
    return `
      <span class="pager-link is-disabled">
        <span class="pager-kicker">${escapeHtml(t(kickerKey))}</span>
        <span class="pager-title">${escapeHtml(t(emptyKey))}</span>
      </span>
    `;
  }

  return `
    <a class="pager-link" href="#${target.route}">
      <span class="pager-kicker">${escapeHtml(t(kickerKey))}</span>
      <span class="pager-title">${escapeHtml(target.title)}</span>
    </a>
  `;
}

function renderLanguagePage() {
  const pageLike = {
    depth: [
      { label_key: "nav.home", route: "/" },
      { label_key: "language.title", route: "/language" }
    ],
    nav: { back_fallback_id: "p00_01", parent_id: "p00_01" }
  };

  applyLocaleDocumentState();
  app.innerHTML = `
    ${renderTopNav(pageLike)}
    <article class="page language-page">
      <header class="article-header">
        <div class="category">${escapeHtml(t("nav.language"))}</div>
        <h1 class="title">${escapeHtml(t("language.title"))}</h1>
        <p class="summary"><span class="summary-line">${escapeHtml(t("language.note"))}</span></p>
      </header>
      <section class="language-panel">
        <div class="language-grid">
          <div class="language-meta">
            <div><strong>${escapeHtml(t("language.current"))}</strong>: ${escapeHtml(currentLocale()?.label || activeLocale)}</div>
            <div><strong>${escapeHtml(t("language.detected"))}</strong>: ${escapeHtml(navigator.language || "unknown")}</div>
          </div>
          <ul class="language-list">
            ${locales.map((locale) => {
              const selected = locale.code === activeLocale;
              return `
                <li>
                  <button class="language-row ${selected ? "is-active" : ""}" type="button" data-locale="${escapeAttr(locale.code)}" aria-pressed="${selected ? "true" : "false"}">
                    <span>
                      <strong>${escapeHtml(locale.label)}</strong>
                      <span class="language-code">${escapeHtml(locale.code)}</span>
                    </span>
                    <span class="language-status">${escapeHtml(t(selected ? "language.active" : "language.available"))}</span>
                  </button>
                </li>
              `;
            }).join("")}
          </ul>
        </div>
      </section>
    </article>
  `;

  wireTopNav(pageLike);
  polishTypography();
  updateReadingProgress();
  app.querySelectorAll("[data-locale]").forEach((button) => {
    button.addEventListener("click", () => {
      activeLocale = button.dataset.locale;
      localStorage.setItem("idong_locale", activeLocale);
      renderLanguagePage();
    });
  });
}

function updateReadingProgress() {
  const bar = app.querySelector(".reading-progress-bar");
  if (!bar) return;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / maxScroll));
  bar.style.transform = `scaleX(${progress})`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (insideQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    if (char !== "\r") {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function buildStringMap(rows) {
  const headers = rows[0];
  const result = new Map();

  rows.slice(1).forEach((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] || "";
    });
    result.set(entry.string_id, entry);
  });

  return result;
}

function icon(name) {
  if (name === "contents") {
    return `
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6h13"></path>
        <path d="M8 12h13"></path>
        <path d="M8 18h13"></path>
        <path d="M3 6h.01"></path>
        <path d="M3 12h.01"></path>
        <path d="M3 18h.01"></path>
      </svg>
    `;
  }

  if (name === "globe") {
    return `
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M3 12h18"></path>
        <path d="M12 3c3 3.2 3 14.8 0 18"></path>
        <path d="M12 3c-3 3.2-3 14.8 0 18"></path>
      </svg>
    `;
  }

  return `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 18l-6-6 6-6"></path>
    </svg>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
