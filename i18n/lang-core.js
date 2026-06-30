/* ============================================================
 * 아이동월드 위키 — 공유 i18n 엔진 (홈/아이템카드 공용)
 *  - 언어 설정은 welcome과 동일한 localStorage "idw_lang" (같은 origin → 자동 공유)
 *  - [data-i18n] 정적 텍스트 치환 + 상단바 언어칩/드롭다운
 *  - 아이템 페이지는 선택 언어의 번역팩(items.<lang>.js / aidong.<lang>.js)을 지연 로드
 *  - 동적 화면(app.js)은 IDWLang.onChange(cb)로 재렌더
 *  데이터: window.IDW_LANGUAGES, window.IDW_WIKI_I18N
 *  팩  : window.IDW_ITEMS_TR[code] = {ICON-xxxx:{nm,on,de}}, window.IDW_AIDONG_TR[code]=[...]
 * ============================================================ */
(function () {
  "use strict";
  var LANGS = window.IDW_LANGUAGES || [];
  var UI    = window.IDW_WIKI_I18N || {};
  var FALLBACK = "ko";
  var DIR = window.IDW_I18N_DIR || "i18n/";       // 페이지별 상대경로
  var LOAD_PACKS = !!window.IDW_LOAD_ITEM_PACKS;  // 아이템 페이지만 true

  window.IDW_ITEMS_TR  = window.IDW_ITEMS_TR  || {};
  window.IDW_AIDONG_TR = window.IDW_AIDONG_TR || {};

  var rtl = {}; LANGS.forEach(function (l) { if (l.rtl) rtl[l.code] = true; });
  function hasLang(c){ return LANGS.some(function(l){return l.code===c;}); }

  function initial() {
    var s = null; try { s = localStorage.getItem("idw_lang"); } catch (e) {}
    if (s && hasLang(s)) return s;
    var nav = navigator.language || "ko";
    if (hasLang(nav)) return nav;
    var b = nav.split("-")[0];
    if (hasLang(b)) return b;
    return FALLBACK;
  }
  var cur = initial();
  var changeCbs = [];

  function t(key) {
    var p = UI[cur] || UI[FALLBACK] || {};
    if (p[key] != null) return p[key];
    var f = UI[FALLBACK] || {};
    return f[key] != null ? f[key] : "";
  }
  // 카테고리/태그/등급 등 맵형 (key: 한국어 코드 → 현지화)
  function map(group, k) {
    var p = UI[cur] || {}, f = UI[FALLBACK] || {};
    if (p[group] && p[group][k] != null) return p[group][k];
    if (f[group] && f[group][k] != null) return f[group][k];
    return null; // 호출측에서 한국어 원본 폴백
  }

  function applyStatic() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (v) el.textContent = v;
    });
    document.documentElement.setAttribute("lang", cur);
    if (rtl[cur]) document.body.setAttribute("dir", "rtl");
    else document.body.removeAttribute("dir");
    document.body.setAttribute("data-lang", cur);
    var nm = document.getElementById("idwLangName");
    var meta = LANGS.filter(function (l) { return l.code === cur; })[0];
    if (nm && meta) nm.textContent = meta.name;
  }

  /* ---- 언어 드롭다운 ---- */
  function buildPanel() {
    if (document.getElementById("idwLangPanel")) return;
    var panel = document.createElement("div");
    panel.id = "idwLangPanel";
    panel.className = "idw-langpanel";
    panel.hidden = true;
    var head = document.createElement("div");
    head.className = "idw-langpanel__head";
    head.setAttribute("data-i18n", "lang_pick");
    head.textContent = t("lang_pick") || "언어 선택";
    panel.appendChild(head);
    var grid = document.createElement("div");
    grid.className = "idw-langgrid";
    LANGS.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "idw-langopt" + (l.code === cur ? " on" : "");
      b.setAttribute("data-code", l.code);
      b.textContent = l.name;
      b.addEventListener("click", function () { setLang(l.code); closePanel(); });
      grid.appendChild(b);
    });
    panel.appendChild(grid);
    document.body.appendChild(panel);
  }
  function openPanel() {
    buildPanel();
    var panel = document.getElementById("idwLangPanel");
    markPanel();
    panel.hidden = false;
    setTimeout(function () { document.addEventListener("click", outside, true); }, 0);
  }
  function closePanel() {
    var panel = document.getElementById("idwLangPanel");
    if (panel) panel.hidden = true;
    document.removeEventListener("click", outside, true);
  }
  function outside(e) {
    var panel = document.getElementById("idwLangPanel");
    var chip = document.getElementById("idwLangChip");
    if (panel && !panel.contains(e.target) && chip && !chip.contains(e.target)) closePanel();
  }
  function markPanel() {
    var panel = document.getElementById("idwLangPanel");
    if (!panel) return;
    panel.querySelectorAll(".idw-langopt").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-code") === cur);
    });
  }

  /* ---- 번역팩 지연 로드 ---- */
  var loaded = {}; // code → true(완료)
  function loadPacks(code, done) {
    if (!LOAD_PACKS || code === "ko" || loaded[code]) { done(); return; }
    var need = [];
    if (!window.IDW_ITEMS_TR[code])  need.push(DIR + "items." + code + ".js");
    if (!window.IDW_AIDONG_TR[code]) need.push(DIR + "aidong." + code + ".js");
    if (!need.length) { loaded[code] = true; done(); return; }
    var left = need.length, finished = false;
    function one() { if (--left <= 0 && !finished) { finished = true; loaded[code] = true; done(); } }
    need.forEach(function (src) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = one;
      s.onerror = function () { one(); }; // 팩 없으면 한국어 폴백
      document.head.appendChild(s);
    });
  }

  function setLang(code) {
    if (!hasLang(code)) return;
    cur = code;
    try { localStorage.setItem("idw_lang", code); } catch (e) {}
    loadPacks(code, function () {
      applyStatic();
      markPanel();
      changeCbs.forEach(function (cb) { try { cb(cur); } catch (e) {} });
    });
  }

  /* ---- 공개 API ---- */
  window.IDWLang = {
    lang: function () { return cur; },
    isRTL: function () { return !!rtl[cur]; },
    t: t,
    map: map,
    setLang: setLang,
    onChange: function (cb) { if (typeof cb === "function") changeCbs.push(cb); }
  };

  /* ---- init ---- */
  function boot() {
    var chip = document.getElementById("idwLangChip");
    if (chip) chip.addEventListener("click", function (e) {
      e.stopPropagation();
      var panel = document.getElementById("idwLangPanel");
      if (panel && !panel.hidden) closePanel(); else openPanel();
    });
    // 초기 팩 로드 후 정적 치환 + 콜백
    loadPacks(cur, function () {
      applyStatic();
      changeCbs.forEach(function (cb) { try { cb(cur); } catch (e) {} });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
