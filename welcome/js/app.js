/* ============================================================
 * IDW 아이동월드 홈 — i18n + 별빛 언어선택 + K-pop 시계
 * 데이터: window.IDW_I18N / window.IDW_LANGUAGES / window.IDW_CLOCK
 * ============================================================ */
(function () {
  "use strict";

  var I18N   = window.IDW_I18N || {};
  var LANGS  = window.IDW_LANGUAGES || [];
  var CLOCK  = window.IDW_CLOCK || {};
  var FALLBACK = "ko";

  var rtlMap = {};
  LANGS.forEach(function (l) { if (l.rtl) rtlMap[l.code] = true; });

  /* 저장된 언어 → 브라우저 언어 → ko */
  function initialLang() {
    var saved = null;
    try { saved = localStorage.getItem("idw_lang"); } catch (e) {}
    if (saved && hasLang(saved)) return saved;
    var nav = (navigator.language || "ko");
    if (hasLang(nav)) return nav;
    var base = nav.split("-")[0];
    if (hasLang(base)) return base;
    return FALLBACK;
  }
  function hasLang(code) { return LANGS.some(function (l) { return l.code === code; }); }

  var currentLang = initialLang();

  /* ---------- i18n ---------- */
  function t(key) {
    var pack = I18N[currentLang] || I18N[FALLBACK] || {};
    if (pack[key] != null) return pack[key];
    var fb = I18N[FALLBACK] || {};
    return fb[key] != null ? fb[key] : "";
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = t(el.getAttribute("data-i18n"));
      // \n → 줄바꿈 (white-space:pre-line 인 요소는 그대로, 그 외엔 <br>)
      el.textContent = val;
    });
    // html lang/dir
    document.documentElement.setAttribute("lang", currentLang);
    var isRtl = !!rtlMap[currentLang];
    if (isRtl) document.body.setAttribute("dir", "rtl");
    else document.body.removeAttribute("dir");
    document.body.setAttribute("data-lang", currentLang);
    // 상단 칩 이름
    var nameEl = document.getElementById("lang-chip-name");
    var meta = LANGS.filter(function (l) { return l.code === currentLang; })[0];
    if (nameEl && meta) nameEl.textContent = meta.name;
    document.title = t("top_label") + " · IDONG World";
  }

  function setLang(code) {
    if (!hasLang(code)) return;
    currentLang = code;
    try { localStorage.setItem("idw_lang", code); } catch (e) {}
    applyI18n();
    markActiveStar();
    renderClock(true); // 언어 바뀌면 시계도 그 언어로
  }

  /* ---------- 별빛 언어 선택 ---------- */
  function buildStarfield() {
    var field = document.getElementById("starfield");
    if (!field) return;
    field.innerHTML = "";
    LANGS.forEach(function (lang, i) {
      var item = document.createElement("div");
      item.className = "star-item";
      item.setAttribute("data-code", lang.code);
      item.style.animationDelay = (i * 0.03) + "s";

      var dot = document.createElement("span");
      dot.className = "star-dot";
      dot.style.animationDelay = (Math.floor(i / 3) * 0.4) + "s"; // 결정론적 반짝 차이

      var name = document.createElement("span");
      name.className = "star-name";
      name.textContent = lang.name;

      item.appendChild(dot);
      item.appendChild(name);
      item.addEventListener("click", function () {
        document.querySelectorAll(".star-dot").forEach(function (d) { d.classList.remove("clicked"); });
        dot.classList.add("clicked");
        setTimeout(function () { dot.classList.remove("clicked"); }, 500);
        setLang(lang.code);
      });
      field.appendChild(item);
    });
    markActiveStar();
  }

  function markActiveStar() {
    document.querySelectorAll(".star-item").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-code") === currentLang);
    });
  }

  /* 상단 칩 → 언어 섹션으로 스크롤 */
  var chip = document.getElementById("lang-chip");
  if (chip) chip.addEventListener("click", function () {
    var sec = document.getElementById("languages");
    if (sec) sec.scrollIntoView({ behavior: "smooth" });
  });

  /* ---------- K-pop 시계 ---------- */
  function rows(slot, num) {
    var pack = CLOCK[currentLang] || CLOCK[FALLBACK] || [];
    return pack.filter(function (r) { return r.slot === slot && r.num === num; });
  }

  // 같은 분 동안에는 같은 가사가 유지되도록, (시각+슬롯) 기반 결정론적 선택
  function pickRow(slot, num, seedKey) {
    var list = rows(slot, num);
    if (!list.length) return null;
    var seed = hashStr(seedKey + ":" + currentLang) % list.length;
    return list[seed];
  }

  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  // 한 슬롯 렌더: 큰 글씨 = 언어별 포맷의 아라비아 숫자(예 "12시" / "12 h") + 작은 가사·출처
  function renderSlot(bigEl, lyricEl, srcEl, row, num, fmt) {
    if (!bigEl) return;
    bigEl.textContent = (fmt || "{n}").replace("{n}", String(num));
    if (row) {                                   // 실제 곡
      if (lyricEl) lyricEl.textContent = row.text || "";
      if (srcEl) srcEl.textContent = row.source ? ("— " + row.source) : "";
    } else {                                     // 가사 없는 시각 → 아이동월드 브랜드 폴백
      if (lyricEl) lyricEl.textContent = t("clock_filler_line") || "";
      var fsrc = t("clock_filler_source");
      if (srcEl) srcEl.textContent = fsrc ? ("— " + fsrc) : "";
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var lastMinuteKey = null;

  function renderClock(force) {
    var now = new Date();
    var h = now.getHours();      // 0~23
    var m = now.getMinutes();    // 0~59
    var minuteKey = h + ":" + m;
    if (!force && minuteKey === lastMinuteKey) return; // 분이 안 바뀌면 가사 유지
    lastMinuteKey = minuteKey;

    var hourRow = pickRow("hour", h, "h" + h + "@" + minuteKey);
    var minRow  = pickRow("minute", m, "m" + m + "@" + minuteKey);

    renderSlot(document.getElementById("clock-hour-big"),   document.getElementById("clock-hour-text"),
               document.getElementById("clock-hour-src"),   hourRow, h, t("clock_hour_fmt") || "{n}시");
    renderSlot(document.getElementById("clock-minute-big"), document.getElementById("clock-minute-text"),
               document.getElementById("clock-minute-src"), minRow, m, t("clock_minute_fmt") || "{n}분");

    var dig = document.getElementById("clock-digital");
    if (dig) dig.textContent = pad(h) + " : " + pad(m);
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- init ---------- */
  applyI18n();
  buildStarfield();
  renderClock(true);
  setInterval(function () { renderClock(false); }, 1000 * 10); // 10초마다 분 변화 체크
})();
