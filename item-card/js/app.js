/* 아이동월드 위키 · 아이템 카드 — 분류(카테고리) + 태그(속성·중첩) + 다국어 */
(function(){
  "use strict";
  var ITEMS=window.IDW_ITEMS||[], AIDONG=window.IDW_AIDONG||[];

  // 분류(카테고리) — 키=한국어 코드(필터/데이터 기준), 표시명은 i18n
  var CAT={
    "자원":{c:"#B98A55",e:"💎",d:"가공 전 원재료·물자."},
    "주방":{c:"#F2994A",e:"🍳",d:"식재료·요리·주방도구 등 부엌 살림 전반."},
    "생활":{c:"#4FB286",e:"🛋️",d:"살림·숙소·청소·위생·반려."},
    "건강":{c:"#3FB6A8",e:"💪",d:"운동·구기·바디케어."},
    "공방":{c:"#E5933C",e:"🛠️",d:"공구·제작·수리·작업 시설 전반."},
    "공연":{c:"#EC5B9B",e:"🎤",d:"무대·악기·팬덤·연습."},
    "문구":{c:"#5AA9C9",e:"✏️",d:"문구·사무·기록·선물."},
    "야외":{c:"#2E9E5B",e:"🏕️",d:"여행·캠핑·물놀이·겨울스포츠·탐험."},
    "패션":{c:"#B06CD6",e:"👗",d:"착용소품·뷰티·잡화."},
    "전자":{c:"#7C6CF0",e:"💾",d:"디지털 기기·데이터·전자부품."},
    "아이돌":{c:"#F0A500",e:"⭐",d:"형태초월 상징·동물 모티프·마음의 조각."}
  };
  var CATORDER=["자원","주방","생활","건강","공방","공연","문구","야외","패션","전자","아이돌"];

  // 태그 패밀리
  var FUNC=["식재료","요리","주방도구"];
  var MAT=["종이","플라스틱","금속","천","고무","나무","유리","오일","안료","돌","젤","산호","가죽","흙"];
  var MATSET={}; MAT.forEach(function(m){MATSET[m]=1;});
  var FAM={ "소장":{c:"#5B8DEF",e:"💠"}, "기능":{c:"#5DA86B",e:"🍴"}, "소재":{c:"#B07D3B",e:"⛏️"}, "형태":{c:"#8891A0",e:"🧩"} };
  function famOf(t){ return t==="소장템"?"소장": (FUNC.indexOf(t)>=0?"기능": (MATSET[t]?"소재":"형태")); }
  var GRADE={1:{t:"흔함",c:"#8A93A6",g:"◈"},2:{t:"희귀",c:"#5B8DEF",g:"◈◈"},3:{t:"유일",c:"#C9A227",g:"◈◈◈"}};

  // ── i18n 접근자 ──
  function L(k,vars){ var s=(window.IDWLang?IDWLang.t(k):"")||""; if(vars){for(var p in vars)s=s.split("{"+p+"}").join(vars[p]);} return s; }
  function MAP(g,k){ return window.IDWLang?IDWLang.map(g,k):null; }
  function curLang(){ return window.IDWLang?IDWLang.lang():"ko"; }
  function catName(c){ return MAP("cat",c)||c; }
  function catDesc(c){ return MAP("cat_desc",c)||(CAT[c]?CAT[c].d:""); }
  function tagName(t){ return MAP("tag",t)||t; }
  function famName(f){ return MAP("fam",f)||f; }
  function gradeName(g){ return MAP("grade",String(g))||(GRADE[g]?GRADE[g].t:""); }
  function itTR(it){ var p=window.IDW_ITEMS_TR&&window.IDW_ITEMS_TR[curLang()]; return p&&p[it.id]; }
  function itemNM(it){ var x=itTR(it); return (x&&x.nm)||it.nm; }
  function itemON(it){ return it.on||it.nm; } /* 사물명=한국어 원본 고정(번역 대상 아님, IPA도 원본) */
  function itemDE(it){ var x=itTR(it); return (x&&x.de)||it.de||""; }
  function aidongName(i){ var p=window.IDW_AIDONG_TR&&window.IDW_AIDONG_TR[curLang()]; return (p&&p[i])||AIDONG[i]; }

  function hexa(h,a){var n=parseInt(h.slice(1),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
  function esc(s){return (s||"").replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m];});}
  function catC(c){return (CAT[c]||{c:"#8A93A6"}).c;}
  function tagColor(t){return FAM[famOf(t)].c;}
  function accent(c){return "--accent:"+c+";--accent-soft:"+hexa(c,.12)+";--accent-ring:"+hexa(c,.24)+";";}
  function gvars(g){var G=GRADE[g];return "--g-c:"+G.c+";--g-soft:"+hexa(G.c,.12)+";--g-ring:"+hexa(G.c,.26)+";";}
  function catChip(c,nav){var d=CAT[c]||{c:"#8A93A6",e:""};
    return '<span class="tag cat"'+(nav?' data-navk="cat" data-navv="'+esc(c)+'"':'')+' style="--tc:'+d.c+';--tcs:'+hexa(d.c,.13)+';--tcr:'+hexa(d.c,.28)+'">'+(d.e?'<span class="te">'+d.e+'</span>':'')+esc(catName(c))+'</span>';}
  function tagChip(t,nav){var c=tagColor(t);
    return '<span class="tag"'+(nav?' data-navk="tag" data-navv="'+esc(t)+'"':'')+' style="--tc:'+c+';--tcs:'+hexa(c,.1)+';--tcr:'+hexa(c,.24)+'">#'+esc(tagName(t))+'</span>';}

  // 카운트
  var catCount={}, tagCount={};
  ITEMS.forEach(function(it){
    it.cat.forEach(function(c){catCount[c]=(catCount[c]||0)+1;});
    it.tg.forEach(function(t){tagCount[t]=(tagCount[t]||0)+1;});
  });

  function initialAidongFromUrl(){
    var raw=""; try{
      var sp=new URLSearchParams(location.search);
      raw=sp.get("ad")||sp.get("aidong")||sp.get("id")||"";
    }catch(e){}
    if(!raw) return -1;
    if(/^AIDONG-\d{4}$/i.test(raw)){
      var n=parseInt(raw.replace(/\D/g,""),10)-1;
      return n>=0&&n<AIDONG.length?n:-1;
    }
    if(/^\d+$/.test(raw)){
      var z=parseInt(raw,10);
      return z>=0&&z<AIDONG.length?z:-1;
    }
    var low=raw.toLowerCase();
    for(var i=0;i<AIDONG.length;i++) if((AIDONG[i]||"").toLowerCase()===low) return i;
    return -1;
  }
  function syncAidongUrl(){
    if(!history || !history.replaceState) return;
    var u=new URL(location.href);
    if(sel.kind==="aidong") u.searchParams.set("ad",String(sel.key));
    else u.searchParams.delete("ad");
    history.replaceState(null,"",u.pathname+u.search+u.hash);
  }

  // 상태: 단일 선택자 (all | cat | tag | aidong)
  var initialAd=initialAidongFromUrl();
  var initFeat=(function(){try{return new URLSearchParams(location.search).get("feature");}catch(e){return null;}})();
  var sel=initFeat==="recipe"?{kind:"recipe",key:null}:(initialAd>=0?{kind:"aidong",key:initialAd}:{kind:"all",key:null}), q="", sort="id";
  var filtered=[], shown=0, BATCH=80;
  var grid=document.getElementById("grid"), sentinel=document.getElementById("sentinel"), countEl=document.getElementById("count");

  function match(it){
    if(sel.kind==="cat"  && it.cat.indexOf(sel.key)<0) return false;
    if(sel.kind==="tag"  && it.tg.indexOf(sel.key)<0) return false;
    if(sel.kind==="aidong" && it.ad.indexOf(sel.key)<0) return false;
    if(q){var s=q.toLowerCase(); if(itemNM(it).toLowerCase().indexOf(s)<0 && it.nm.toLowerCase().indexOf(s)<0 && it.id.toLowerCase().indexOf(s)<0) return false;}
    return true;
  }
  function applyFilter(){
    var lg=curLang();
    if(sel.kind==="recipe"){ renderRecipeFeature(); return; }
    grid.classList.remove("recipes");
    filtered=ITEMS.filter(match);
    filtered.sort(function(a,b){
      if(sort==="name") return itemNM(a).localeCompare(itemNM(b),lg);
      if(sort==="rare") return (b.gr-a.gr)||(a.rf-b.rf)||a.id.localeCompare(b.id);
      if(sort==="ref")  return (b.rf-a.rf)||a.id.localeCompare(b.id);
      return a.id.localeCompare(b.id);
    });
    grid.innerHTML=""; shown=0;
    countEl.textContent=L("count",{n:filtered.length.toLocaleString()});
    updateBack();
    syncAidongUrl();
    renderAidongBanner();
    if(!filtered.length){grid.innerHTML='<div class="empty">'+esc(L("empty"))+'</div>';return;}
    renderMore();
  }
  function cardHtml(it){
    var lead=catC(it.cat[0]), G=GRADE[it.gr];
    var catChips=it.cat.map(function(c){return catChip(c);}).join("");
    var shownTags=[]; if(it.tg.indexOf("소장템")>=0) shownTags.push("소장템");
    it.tg.forEach(function(t){if(t!=="소장템"&&shownTags.length<3)shownTags.push(t);});
    var more=it.tg.length-shownTags.length;
    var tagHtml=shownTags.map(function(t){return tagChip(t);}).join("")+(more>0?'<span class="more">+'+more+'</span>':'');
    var sub2 = curLang()==="ko" ? ('<p class="sub2">'+esc(tail(it.pt))+'</p>') : "";
    var u1badge = it.u1?'<span class="u1badge" title="update1 · '+esc(u1Label(it.u1))+'">'+esc(u1Label(it.u1))+'</span>':'';
    var art = it.im?'<img src="assets/thumb/'+it.im+'" srcset="assets/mini/'+it.im+' 96w, assets/thumb/'+it.im+' 320w" sizes="(max-width:560px) 60px, 200px" alt="'+esc(itemNM(it))+'" loading="lazy" />':phTag();
    return '<article class="card'+(it.u1?" is-u1":"")+'" data-id="'+it.id+'"'+(it.u1?' data-u1="'+it.u1+'"':'')+' style="'+accent(lead)+gvars(it.gr)+'">'
      +'<div class="card__top"><div class="tags">'+catChips+'</div>'
        +'<span class="grade"><span class="gem">'+G.g+'</span>'+esc(gradeName(it.gr))+'</span></div>'
      +'<div class="art"><span class="tw a"></span><span class="tw b"></span>'+u1badge+art+'</div>'
      +'<div class="card__body"><h3 class="name">'+esc(itemNM(it))+'</h3>'
        +sub2
        +'<div class="tags small">'+tagHtml+'</div></div></article>';
  }
  function tail(pt){if(!pt)return "";var p=pt.split("›");return p[p.length-1].trim();}
  function renderMore(){ if(shown>=filtered.length)return;
    var end=Math.min(shown+BATCH,filtered.length),h=""; for(var i=shown;i<end;i++)h+=cardHtml(filtered[i]);
    grid.insertAdjacentHTML("beforeend",h); shown=end; }
  if("IntersectionObserver" in window) new IntersectionObserver(function(e){if(e[0].isIntersecting)renderMore();},{rootMargin:"600px"}).observe(sentinel);

  // ── 네비 ──
  var filterBox=document.getElementById("filters"), tagdesc=document.getElementById("tagdesc"), subBox=document.getElementById("subfilter");
  function chip(label,kind,key,color,emoji,cnt,dot){
    var on=sel.kind===kind&&sel.key===key, ring=color?hexa(color,.36):"rgba(91,141,239,.3)";
    return '<span class="chip'+(on?" on":"")+'" data-k="'+kind+'" data-v="'+esc(key==null?"":key)+'" style="'
      +(on&&color?("background:"+color+";--chip-ring:"+ring+";"):"")+'">'
      +(dot&&color?'<i style="background:'+color+'"></i>':'')+(emoji?emoji+" ":"")+esc(label)
      +(cnt!=null?'<span class="n">'+cnt.toLocaleString()+'</span>':'')+'</span>';
  }
  function formTagsByCount(min){
    return Object.keys(tagCount).filter(function(t){return famOf(t)==="형태"&&tagCount[t]>=min;})
      .sort(function(a,b){return tagCount[b]-tagCount[a];});
  }
  function renderNav(){
    var cat='<span class="grouplabel">'+esc(L("nav_cat"))+'</span>'+chip(L("all"),"all",null,"#3a4150","",ITEMS.length,false);
    CATORDER.forEach(function(k){var d=CAT[k];cat+=chip("#"+catName(k),"cat",k,d.c,d.e,catCount[k]||0,true);});

    var nTags=0;
    var tagrow=function(famkey,arr){ nTags+=arr.length; var h='<span class="famlabel">'+FAM[famkey].e+' '+esc(famName(famkey))+'</span>';
      arr.forEach(function(t){h+=chip("#"+tagName(t),"tag",t,tagColor(t),"",tagCount[t]||0,true);}); return '<div class="famrow">'+h+'</div>'; };
    var rows= tagrow("소장", ["소장템"])
      + tagrow("기능", FUNC.filter(function(t){return tagCount[t];}))
      + tagrow("소재", MAT.filter(function(t){return tagCount[t];}).sort(function(a,b){return tagCount[b]-tagCount[a];}))
      + tagrow("형태", formTagsByCount(10));
    var open=sel.kind==="tag";
    var tg='<div class="tags-head"><span class="grouplabel">'+esc(L("nav_tag"))+'</span>'
      + '<button type="button" class="tags-toggle" id="tagsToggle">'+(open?'▴ '+esc(L("tags_less")):'▾ '+esc(L("tags_more"))+' ('+nTags+')')+'</button></div>'
      + '<div class="tags-body">'+rows+'</div>';

    var feat='<div class="chipgroup feat"><span class="grouplabel">✨ '+esc(L("nav_feat")||"특집")+'</span>'+chip("🍳 "+(L("feat_recipe")||"요리 레시피"),"recipe",null,"#F2994A","",Object.keys(RECIPES).length,false)+'</div>';
    filterBox.innerHTML='<div class="chipgroup">'+cat+'</div>'+feat+'<div class="chipgroup tags-group'+(open?" open":"")+'">'+tg+'</div>';

    if(sel.kind==="cat"&&CAT[sel.key]){tagdesc.hidden=false;tagdesc.innerHTML='<b style="color:'+CAT[sel.key].c+'">#'+esc(catName(sel.key))+'</b> — '+esc(catDesc(sel.key));}
    else if(sel.kind==="tag"&&sel.key==="소장템"){tagdesc.hidden=false;tagdesc.innerHTML='<b style="color:#5B8DEF">#'+esc(tagName("소장템"))+'</b> — '+esc(L("tagdesc_collect"));}
    else if(sel.kind==="aidong"){tagdesc.hidden=false;tagdesc.textContent=L("tagdesc_aidong",{name:aidongName(sel.key),n:filtered.length});}
    else tagdesc.hidden=true;
  }
  filterBox.addEventListener("click",function(e){
    var tog=e.target.closest(".tags-toggle");
    if(tog){var g=filterBox.querySelector(".tags-group");var op=g.classList.toggle("open");
      tog.textContent=op?("▴ "+L("tags_less")):("▾ "+L("tags_more"));return;}
    var c=e.target.closest(".chip");if(!c)return;
    sel={kind:c.dataset.k,key:(c.dataset.k==="all"||c.dataset.k==="recipe")?null:c.dataset.v};
    if(sel.kind!=="aidong"){var asel=document.getElementById("aidongSel");if(asel)asel.value="-1";}
    applyFilter();renderNav();window.scrollTo({top:0,behavior:"smooth"});});

  // 아이동 도감 (상시)
  function renderSub(){
    var opts='<option value="-1">'+esc(L("aidong_select",{n:AIDONG.length}))+'</option>';
    for(var i=0;i<AIDONG.length;i++)opts+='<option value="'+i+'"'+(sel.kind==="aidong"&&sel.key===i?" selected":"")+'>'+esc(aidongName(i))+'</option>';
    subBox.hidden=false;
    subBox.innerHTML='<span class="sublabel">'+esc(L("aidong_label"))+'</span><select id="aidongSel">'+opts+'</select><span class="subhint">'+esc(L("aidong_hint"))+'</span>';
    document.getElementById("aidongSel").addEventListener("change",function(){
      var v=parseInt(this.value,10);
      if(v<0){sel={kind:"all",key:null};} else {sel={kind:"aidong",key:v};}
      applyFilter();renderNav();});
  }

  // 검색/정렬
  var qEl=document.getElementById("q"),qClear=document.getElementById("qclear"),sortEl=document.getElementById("sort"),t=null;
  qEl.addEventListener("input",function(){qClear.hidden=!qEl.value;clearTimeout(t);t=setTimeout(function(){q=qEl.value;applyFilter();},130);});
  qClear.addEventListener("click",function(){qEl.value="";qClear.hidden=true;q="";applyFilter();qEl.focus();});
  sortEl.addEventListener("change",function(){sort=sortEl.value;applyFilter();});

  // ── 뷰: 리스트 / 상세 ──
  var listView=document.getElementById("listView"), detailView=document.getElementById("detailView"),
      detail=document.getElementById("detail"), backBtn=document.getElementById("backBtn"),
      dBack=document.getElementById("dBack"), crumb=document.getElementById("crumb"), byId={};
  ITEMS.forEach(function(it){byId[it.id]=it;});
  var HOME="../index.html";
  var curDetail=null;

  // ── 레시피(요리↔재료) + update1 표식 ──
  var RECIPES=window.IDW_RECIPES||{}, USEDIN={};
  Object.keys(RECIPES).forEach(function(d){ (RECIPES[d]||[]).forEach(function(ing){ (USEDIN[ing]=USEDIN[ing]||[]).push(d); }); });
  var U1LABEL={D:"도감",C:"항해",F:"요리"};
  function u1Label(u){ return (u||"").split("").map(function(c){return U1LABEL[c]||c;}).join("·"); }
  function phTag(){ return '<div class="planned-ph">'+esc(L("planned")||"준비중")+'</div>'; }
  function artThumb(it){ return (it&&it.im)?'<img src="assets/thumb/'+it.im+'" srcset="assets/mini/'+it.im+' 96w, assets/thumb/'+it.im+' 320w" sizes="120px" alt="'+esc(itemNM(it))+'" loading="lazy"/>':phTag(); }
  function recipeMini(icon){ var it=byId[icon]; if(!it) return ''; var img=it.im?'<img src="assets/mini/'+it.im+'" alt="'+esc(itemNM(it))+'"/>':'<span class="mini-ph">'+esc(L("planned")||"준비중")+'</span>'; return '<span class="rmini" data-di="'+esc(icon)+'" title="'+esc(itemNM(it))+'">'+img+'<b>'+esc(itemNM(it))+'</b></span>'; }
  function recipeStripHtml(it){ if(RECIPES[it.id]){ var g=RECIPES[it.id]; return '<div class="recipe-strip"><div class="rs-title">🍳 '+esc(L("recipe")||"레시피")+' <span>'+g.length+'</span></div><div class="rs-items">'+g.map(recipeMini).join("")+'</div></div>'; } var ds=USEDIN[it.id]; if(ds&&ds.length){ return '<div class="recipe-strip alt"><div class="rs-title">🍽️ '+esc(L("usedin")||"이 재료가 들어가는 요리")+' <span>'+ds.length+'</span></div><div class="rs-items">'+ds.map(recipeMini).join("")+'</div></div>'; } return ""; }
  function recipeCardHtml(it){ var g=RECIPES[it.id]||[]; return '<article class="card recipe-card'+(it.u1?" is-u1":"")+'" data-id="'+it.id+'"'+(it.u1?' data-u1="'+it.u1+'"':'')+' style="'+accent(catC(it.cat[0]))+'"><div class="rc-dish">'+artThumb(it)+'<h3 class="name">'+esc(itemNM(it))+'</h3></div><div class="rc-eq">=</div><div class="rc-ings">'+g.map(recipeMini).join("")+'</div></article>'; }
  function renderRecipeFeature(){ var lg=curLang(); var ds=Object.keys(RECIPES).map(function(d){return byId[d];}).filter(Boolean); if(q){var s=q.toLowerCase(); ds=ds.filter(function(it){return itemNM(it).toLowerCase().indexOf(s)>=0||it.nm.toLowerCase().indexOf(s)>=0;});} ds.sort(function(a,b){ if(sort==="name")return itemNM(a).localeCompare(itemNM(b),lg); return a.id.localeCompare(b.id); }); filtered=ds; shown=ds.length; countEl.textContent=L("count",{n:ds.length.toLocaleString()}); updateBack(); syncAidongUrl(); if(bannerEl)bannerEl.hidden=true; grid.classList.add("recipes"); grid.innerHTML=ds.length?ds.map(recipeCardHtml).join(""):'<div class="empty">'+esc(L("empty"))+'</div>'; }

  function famGroup(it){
    var groups={"기능":[],"소재":[],"형태":[],"소장":[]};
    it.tg.forEach(function(t){groups[famOf(t)].push(t);});
    var order=["소장","기능","소재","형태"],h="";
    order.forEach(function(f){ if(groups[f].length) h+='<div class="ir"><span class="k">'+FAM[f].e+' '+esc(famName(f))+'</span><span class="v"><div class="tags">'+groups[f].map(function(t){return tagChip(t,true);}).join("")+'</div></span></div>'; });
    return h;
  }
  function showDetail(it){
    curDetail=it;
    var lead=catC(it.cat[0]),G=GRADE[it.gr];
    var catChips=it.cat.map(function(c){return catChip(c,true);}).join("");
    var aidongRow=""; if(it.ad&&it.ad.length){
      aidongRow='<div class="ir"><span class="k">'+esc(L("d_aidong"))+'</span><span class="v aidong">'
        +it.ad.map(function(i){return '<span class="ad" data-navk="aidong" data-navv="'+i+'">'+esc(aidongName(i))+'</span>';}).join("")+'</span></div>';}
    var nm=itemNM(it), on=itemON(it), de=itemDE(it), diff=on&&on!==nm;
    detail.setAttribute("style",accent(lead)+gvars(it.gr));
    detail.innerHTML='<div class="detail__hero"><div class="row"><div class="tags">'+catChips+'</div>'
        +'<span class="grade"><span class="gem">'+G.g+'</span>'+esc(gradeName(it.gr))+'</span></div>'
        +'<div class="detail__art"><span class="tw a"></span><span class="tw b"></span>'+(it.im?'<img src="assets/thumb/'+it.im+'" alt="'+esc(nm)+'"/>':phTag())+'</div>'
        +'<h2 class="objname">'+esc(on||nm)+'</h2>'+(it.ipa?'<div class="ipa">['+esc(it.ipa)+']</div>':'')
      +'</div>'
      +'<div class="detail__body">'
        +'<div class="fullname">'+(diff?'<span class="fnlabel">'+esc(L("d_fullname"))+'</span> ':'')+esc(nm)+'<span class="id">'+it.id+'</span></div>'
        +(de?'<p class="lore">'+esc(de)+'</p>':'<div class="lore tbd">'+esc(L("desc_tbd"))+'</div>')
        +recipeStripHtml(it)
        +'<div class="info">'
          +'<div class="ir"><span class="k">'+esc(L("d_cat"))+'</span><span class="v"><div class="tags">'+catChips+'</div></span></div>'
          +famGroup(it)
          +'<div class="ir"><span class="k">'+esc(L("d_grade"))+'</span><span class="v"><span class="gem" style="color:'+G.c+'">'+G.g+'</span> '+esc(gradeName(it.gr))+'</span></div>'
          +'<div class="ir"><span class="k">'+esc(L("d_ref"))+'</span><span class="v">'+esc(L("d_ref_val",{n:it.rf}))+'</span></div>'
          +aidongRow
          +(it.u1?'<div class="ir"><span class="k">update1</span><span class="v"><span class="u1chip">'+esc(u1Label(it.u1))+'</span></span></div>':'')
          +'<div class="ir"><span class="k">'+esc(L("d_icon"))+'</span><span class="v path">'+esc(it.im||"(준비중)")+'</span></div>'
        +'</div><button class="detail__back" id="detailBack">'+esc(L("back"))+'</button></div>';
    if(!listView.hidden) listScroll=window.scrollY; // 리스트에서 진입할 때만 위치 저장
    detailView.hidden=false; listView.hidden=true; window.scrollTo(0,0);
    detail.querySelector("#detailBack").onclick=function(){showList(true);};
  }
  var listScroll=0;
  function showList(restore){ detailView.hidden=true; listView.hidden=false; window.scrollTo(0, restore?listScroll:0); }

  function updateBack(){
    if(sel.kind==="all"){ backBtn.textContent=L("back_home"); crumb.textContent=""; }
    else{ backBtn.textContent=L("back_main");
      var label=(sel.kind==="recipe"?"🍳 "+(L("feat_recipe")||"요리 레시피"):(sel.kind==="aidong"?("🐾 "+aidongName(sel.key)):("#"+(sel.kind==="cat"?catName(sel.key):tagName(sel.key)))));
      crumb.textContent=label+" ("+filtered.length.toLocaleString()+")"; }
  }
  backBtn.addEventListener("click",function(){
    if(sel.kind!=="all"){ sel={kind:"all",key:null}; applyFilter(); renderNav(); renderSub(); window.scrollTo(0,0); }
    else { location.href=HOME; }
  });
  dBack.addEventListener("click",function(){showList(true);});

  detail.addEventListener("click",function(e){
    var m=e.target.closest("[data-di]"); if(m){var mi=byId[m.dataset.di]; if(mi)showDetail(mi); return;}
    var n=e.target.closest("[data-navk]"); if(!n)return;
    var k=n.dataset.navk,v=n.dataset.navv;
    sel = k==="aidong"?{kind:"aidong",key:parseInt(v,10)}:{kind:k,key:v};
    showList(); applyFilter(); renderNav(); renderSub(); window.scrollTo(0,0);
  });
  grid.addEventListener("click",function(e){var m=e.target.closest("[data-di]");if(m){var mi=byId[m.dataset.di];if(mi)showDetail(mi);return;}var c=e.target.closest(".card");if(c)showDetail(byId[c.dataset.id]);});
  document.addEventListener("keydown",function(e){ if(e.key==="Escape" && !detailView.hidden) showList(true); });

  // ── 아이동 배너 (특정 아이동 도감 필터 시 리스트 위에) ──
  var SHEET_D=window.IDW_SHEET||[], bannerEl=document.getElementById("aidongBanner"), koTried=false;
  function loadKoOnce(cb){
    if(window.IDW_SHEET_KO||koTried){cb();return;}
    koTried=true;
    var s=document.createElement("script"); s.src="../sheet/data/ko.js"; s.onload=cb; s.onerror=cb;
    document.head.appendChild(s);
  }
  function renderAidongBanner(){
    if(!bannerEl) return;
    if(sel.kind!=="aidong"){ bannerEl.hidden=true; return; }
    var i=sel.key, sd=SHEET_D[i]||{}, name=aidongName(i);
    var icon=sd.id?("../sheet/assets/icon/"+sd.id+".webp"):"";
    var ko=window.IDW_SHEET_KO&&window.IDW_SHEET_KO[i];
    var desc=(ko&&ko.intro)||[sd.an,sd.il].filter(Boolean).join(" · ");
    bannerEl.href="../sheet/index.html?ad="+i;
    bannerEl.innerHTML='<div class="ab-art"><img src="'+icon+'" alt="'+esc(name)+'" onerror="this.style.display=\'none\'"/></div>'
      +'<div class="ab-body"><div class="ab-eyebrow">'+esc(L("ab_owner"))+'</div>'
      +'<h2 class="ab-name">'+esc(name)+'</h2>'
      +'<p class="ab-desc">'+esc(desc)+'</p>'
      +'<span class="ab-cta">'+esc(L("ab_cta"))+'</span></div>';
    bannerEl.hidden=false;
    if(!(ko&&ko.intro)) loadKoOnce(function(){
      if(sel.kind==="aidong"&&sel.key===i){var k2=window.IDW_SHEET_KO&&window.IDW_SHEET_KO[i];
        if(k2&&k2.intro){var d=bannerEl.querySelector(".ab-desc"); if(d)d.textContent=k2.intro;}}
    });
  }

  // ── 렌더(언어 적용) ──
  function renderAll(){
    qEl.placeholder=L("search_ph");
    var subEl=document.getElementById("sub"); if(subEl) subEl.textContent=L("ic_sub",{n:ITEMS.length.toLocaleString()});
    renderNav(); renderSub(); applyFilter();
    if(detailView && !detailView.hidden && curDetail) showDetail(curDetail);
  }
  if(window.IDWLang && IDWLang.onChange) IDWLang.onChange(renderAll);

  // init
  renderAll();

  // ── 월드북 코덱스 카드 → 아이템 딥링크(?icon=ICON-xxxx) ──
  (function deepLinkIcon(){
    var raw=""; try{ raw=(new URLSearchParams(location.search).get("icon")||"").trim(); }catch(e){}
    if(!raw) return;
    var id=raw.toUpperCase();
    var it=byId[id];
    if(!it && /^\d+$/.test(raw)){ id="ICON-"+("0000"+raw).slice(-4); it=byId[id]; }
    if(!it) return;
    showDetail(it);
    var db=detail.querySelector("#detailBack");
    if(db && history.length>1){ db.textContent="← 월드북으로 돌아가기"; db.onclick=function(){ history.back(); }; }
  }());
})();
