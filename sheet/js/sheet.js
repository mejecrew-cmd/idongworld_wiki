/* 아이동월드 위키 · 아이동 시트북 */
(function(){
  "use strict";

  var AIDONG = window.IDW_AIDONG || [];
  var SHEET = window.IDW_SHEET || [];
  var PEDIA = window.IDW_PEDIA || [];
  var KO = window.IDW_SHEET_KO || [];
  var q = "";
  var animal = "";
  var sort = "no";
  var selected = -1;

  var listView = document.getElementById("listView");
  var detailView = document.getElementById("detailView");
  var grid = document.getElementById("grid");
  var count = document.getElementById("count");
  var qEl = document.getElementById("q");
  var qClear = document.getElementById("qclear");
  var sortEl = document.getElementById("sort");
  var filters = document.getElementById("animalFilters");
  var clearAnimal = document.getElementById("clearAnimal");
  var activeFilter = document.getElementById("activeFilter");
  var detail = document.getElementById("detail");
  var backToList = document.getElementById("backToList");
  var itemBookTop = document.getElementById("itemBookTop");

  function L(k){ return window.IDWLang ? IDWLang.t(k) : ""; }
  function curLang(){ return window.IDWLang ? IDWLang.lang() : "ko"; }
  function esc(s){ return (s == null ? "" : String(s)).replace(/[&<>"]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m];}); }
  function aidongName(i){
    var p = window.IDW_AIDONG_TR && window.IDW_AIDONG_TR[curLang()];
    return (p && p[i]) || AIDONG[i] || (SHEET[i] && SHEET[i].id) || "";
  }
  function no(i){ return String(i + 1).padStart(3,"0"); }
  function cleanIsland(s){ return (s || "").replace(/개인섬$/,"섬"); }
  function textList(arr, limit){
    var list = arr || [];
    return list.slice(0,limit || list.length).join(" · ");
  }
  function content(i){
    var row = SHEET[i] || {};
    var name = aidongName(i);
    var island = cleanIsland(row.il || "");
    return KO[i] || {
      intro: name + "는 " + island + "에서 " + row.an + "의 작고 또렷한 리듬으로 하루를 연다.",
      island: island + "은 이 아이동의 하루가 모이는 장소다.",
      mood: row.an + "다운 움직임과 조용한 환대가 먼저 느껴진다.",
      keywords: [row.an + " 실루엣","작은 환대","발자국 리듬"],
      props: [name + "등", row.an + "리본", name + "발자국"],
      todo: [island + " 둘러보기"],
      voice: ["천천히 들어와도 돼."],
      story: [row.an + "의 발자국을 따라 작은 소품을 찾아간다."]
    };
  }
  function imgTag(i, cls){
    var id = SHEET[i].id;
    return '<img class="'+(cls||"")+'" src="assets/icon/'+id+'.webp" alt="'+esc(aidongName(i))+'" loading="lazy" onerror="this.closest(\'.aidong-art,.profile__art\').classList.add(\'missing\');this.remove();" />';
  }
  function itemBookHref(i){ return "../item-card/index.html?ad=" + encodeURIComponent(String(i)); }
  function queryIndex(){
    var sp = new URLSearchParams(location.search);
    var raw = sp.get("ad") || sp.get("id") || "";
    if (!raw) return -1;
    if (/^AIDONG-\d{4}$/i.test(raw)) {
      var found = SHEET.findIndex(function(s){ return s.id.toLowerCase() === raw.toLowerCase(); });
      return found >= 0 ? found : -1;
    }
    if (/^\d+$/.test(raw)) {
      var n = parseInt(raw,10);
      return n >= 0 && n < SHEET.length ? n : -1;
    }
    var lowered = raw.toLowerCase();
    for (var i=0;i<AIDONG.length;i++) {
      if ((AIDONG[i] || "").toLowerCase() === lowered) return i;
    }
    return -1;
  }
  function setUrl(i){
    var url = new URL(location.href);
    if (i >= 0) url.searchParams.set("ad", String(i));
    else url.searchParams.delete("ad");
    history.replaceState(null,"",url.pathname + url.search + url.hash);
  }

  function animalCounts(){
    var out = {};
    SHEET.forEach(function(s){ out[s.an] = (out[s.an] || 0) + 1; });
    return out;
  }
  function renderFilters(){
    var counts = animalCounts();
    var keys = Object.keys(counts).sort(function(a,b){ return counts[b] - counts[a] || a.localeCompare(b,"ko"); });
    filters.innerHTML = keys.map(function(k){
      return '<button type="button" class="chip'+(animal===k?" on":"")+'" data-animal="'+esc(k)+'"><span>'+esc(k)+'</span><span class="n">'+counts[k]+'</span></button>';
    }).join("");
    clearAnimal.hidden = !animal;
    if (animal) {
      activeFilter.hidden = false;
      activeFilter.textContent = animal + " 아이동만 보는 중";
    } else {
      activeFilter.hidden = true;
    }
  }

  function filteredIndexes(){
    var s = q.trim().toLowerCase();
    var arr = [];
    for (var i=0;i<SHEET.length;i++) {
      var row = SHEET[i];
      if (animal && row.an !== animal) continue;
      if (s) {
        var c = content(i);
        var hay = [aidongName(i), AIDONG[i], row.id, row.an, row.il, c.intro, c.mood, textList(c.keywords), textList(c.props), textList(c.voice,2)].join(" ").toLowerCase();
        if (hay.indexOf(s) < 0) continue;
      }
      arr.push(i);
    }
    arr.sort(function(a,b){
      if (sort === "name") return aidongName(a).localeCompare(aidongName(b),curLang());
      if (sort === "animal") return SHEET[a].an.localeCompare(SHEET[b].an,"ko") || a-b;
      if (sort === "island") return SHEET[a].il.localeCompare(SHEET[b].il,"ko") || a-b;
      return a-b;
    });
    return arr;
  }

  function card(i){
    var row = SHEET[i];
    return '<article class="card">'
      + '<button type="button" data-index="'+i+'">'
        + '<div class="aidong-art">'+imgTag(i)+'</div>'
        + '<div class="card__body">'
          + '<span class="no">AIDONG '+no(i)+'</span>'
          + '<h2>'+esc(aidongName(i))+'</h2>'
          + '<div class="meta"><span class="pill animal">'+esc(row.an)+'</span><span class="pill island">'+esc(cleanIsland(row.il))+'</span></div>'
        + '</div>'
      + '</button>'
    + '</article>';
  }

  function renderList(){
    var arr = filteredIndexes();
    count.textContent = arr.length.toLocaleString() + " / " + SHEET.length.toLocaleString();
    grid.innerHTML = arr.length ? arr.map(card).join("") : '<div class="empty">조건에 맞는 아이동이 없습니다.</div>';
    renderFilters();
  }

  function section(title, body, wide){
    return '<section class="section'+(wide?" wide":"")+'"><h3>'+esc(title)+'</h3><p>'+esc(body)+'</p></section>';
  }
  function kwSection(kw){
    var cats=[["코어",kw.core],["감성·분위기",kw.vibe],["사물·공간",kw.obj],["행동·태도",kw.act],["구문·복합",kw.phrase]];
    var rows=cats.filter(function(c){return c[1]&&c[1].length;}).map(function(c){
      var chips=c[1].map(function(w){return '<span class="kw-chip">'+esc(w)+'</span>';}).join("");
      return '<div class="kw-cat"><span class="kw-label">'+esc(c[0])+'</span><span class="kw-list">'+chips+'</span></div>';
    }).join("");
    return '<section class="section wide kw-banner"><div class="kw-eyebrow">아이동 키워드</div>'
      +'<div class="kw-cats">'+rows+'</div></section>';
  }
  function tagHero(tag){
    return '<section class="section wide tag-hero"><span class="tag-hero__quote">“</span>'
      +'<p class="tag-hero__line">'+esc(tag)+'</p></section>';
  }
  function voiceSection(voice){
    var lines=(voice||[]).filter(function(v){return v&&String(v).trim();});
    if(!lines.length) return "";
    var items=lines.map(function(v){
      var t=String(v).trim().replace(/^[\s"“”'’]+|[\s"“”'’]+$/g,"");
      return '<li class="voice-line">'+esc(t)+'</li>';
    }).join("");
    return '<section class="section wide voice-sec"><h3>하루의 목소리</h3><ul class="voice-list">'+items+'</ul></section>';
  }
  function pediaGrid(i){
    var items = PEDIA[i] || [];
    var h = "";
    for (var n=0;n<25;n++) {
      var im = items[n];
      h += '<a class="pedia-slot'+(im ? "" : " missing")+'" href="'+itemBookHref(i)+'" title="아이템 카드북에서 보기">';
      if (im) h += '<img src="../item-card/assets/mini/'+esc(im)+'" alt="" loading="lazy" onerror="this.classList.add(\'is-missing\');this.closest(\'.pedia-slot\').classList.add(\'missing\');" />';
      h += '</a>';
    }
    return h;
  }
  function showDetail(i){
    if (i < 0 || i >= SHEET.length) return;
    selected = i;
    var row = SHEET[i];
    var name = aidongName(i);
    var island = cleanIsland(row.il);
    var c = content(i);
    var line = c.intro || (name + "는 " + island + "에서 " + row.an + "의 작고 또렷한 리듬으로 하루를 연다.");
    var kw = (window.IDW_SHEET_KW && window.IDW_SHEET_KW[i]) || null;
    itemBookTop.href = itemBookHref(i);
    detail.innerHTML =
      '<aside class="profile">'
        + '<div class="profile__art aidong-art">'+imgTag(i)+'</div>'
        + '<div class="profile__body">'
          + '<span class="id">'+esc(row.id)+' · NO. '+no(i)+'</span>'
          + '<h2>'+esc(name)+'</h2>'
          + '<p class="line">'+esc(line)+'</p>'
          + '<div class="quick">'
            + '<div><span>동물</span><strong>'+esc(row.an)+'</strong></div>'
            + '<div><span>섬</span><strong>'+esc(island)+'</strong></div>'
          + '</div>'
        + '</div>'
      + '</aside>'
      + '<div class="sections">'
        + (kw && kw.tag ? tagHero(kw.tag) : "")
        + (c.look ? section("외모", c.look) : (kw ? "" : section("모습과 빛깔", c.mood)))
        + (kw ? kwSection(kw) : section("무대에서 온 결", textList(c.keywords,6)))
        + voiceSection(c.voice)
        + section(island || "돌아갈 섬", c.island)
        + '<section class="section wide"><div class="pedia-head"><h3>품은 것들</h3><a href="'+itemBookHref(i)+'">아이템 카드북에서 보기</a></div><div class="pedia-grid">'+pediaGrid(i)+'</div></section>'
      + '</div>';
    listView.hidden = true;
    detailView.hidden = false;
    setUrl(i);
    window.scrollTo(0,0);
  }
  function showList(){
    selected = -1;
    detailView.hidden = true;
    listView.hidden = false;
    setUrl(-1);
    window.scrollTo(0,0);
  }

  filters.addEventListener("click",function(e){
    var b = e.target.closest("[data-animal]");
    if (!b) return;
    animal = animal === b.dataset.animal ? "" : b.dataset.animal;
    renderList();
  });
  clearAnimal.addEventListener("click",function(){ animal = ""; renderList(); });
  grid.addEventListener("click",function(e){
    var b = e.target.closest("[data-index]");
    if (b) showDetail(parseInt(b.dataset.index,10));
  });
  qEl.addEventListener("input",function(){
    q = qEl.value;
    qClear.hidden = !q;
    renderList();
  });
  qClear.addEventListener("click",function(){
    q = "";
    qEl.value = "";
    qClear.hidden = true;
    renderList();
    qEl.focus();
  });
  sortEl.addEventListener("change",function(){ sort = sortEl.value; renderList(); });
  backToList.addEventListener("click",showList);
  document.addEventListener("keydown",function(e){ if(e.key === "Escape" && !detailView.hidden) showList(); });

  function renderAll(){
    renderList();
    if (selected >= 0) showDetail(selected);
  }
  if (window.IDWLang && IDWLang.onChange) IDWLang.onChange(renderAll);

  var first = queryIndex();
  renderList();
  if (first >= 0) showDetail(first);
})();
