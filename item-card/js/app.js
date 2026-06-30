/* 아이동월드 위키 · 아이템 카드 — 분류(카테고리) + 태그(속성·중첩) */
(function(){
  "use strict";
  var ITEMS=window.IDW_ITEMS||[], AIDONG=window.IDW_AIDONG||[];

  // 분류(카테고리)
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

  function hexa(h,a){var n=parseInt(h.slice(1),16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")";}
  function esc(s){return (s||"").replace(/[&<>"]/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m];});}
  function catC(c){return (CAT[c]||{c:"#8A93A6"}).c;}
  function tagColor(t){return FAM[famOf(t)].c;}
  function accent(c){return "--accent:"+c+";--accent-soft:"+hexa(c,.12)+";--accent-ring:"+hexa(c,.24)+";";}
  function gvars(g){var G=GRADE[g];return "--g-c:"+G.c+";--g-soft:"+hexa(G.c,.12)+";--g-ring:"+hexa(G.c,.26)+";";}
  function tail(pt){if(!pt)return "";var p=pt.split("›");return p[p.length-1].trim();}
  function catChip(c,nav){var d=CAT[c]||{c:"#8A93A6",e:""};
    return '<span class="tag cat"'+(nav?' data-navk="cat" data-navv="'+esc(c)+'"':'')+' style="--tc:'+d.c+';--tcs:'+hexa(d.c,.13)+';--tcr:'+hexa(d.c,.28)+'">'+(d.e?'<span class="te">'+d.e+'</span>':'')+esc(c)+'</span>';}
  function tagChip(t,nav){var c=tagColor(t);
    return '<span class="tag"'+(nav?' data-navk="tag" data-navv="'+esc(t)+'"':'')+' style="--tc:'+c+';--tcs:'+hexa(c,.1)+';--tcr:'+hexa(c,.24)+'">#'+esc(t)+'</span>';}

  // 카운트
  var catCount={}, tagCount={};
  ITEMS.forEach(function(it){
    it.cat.forEach(function(c){catCount[c]=(catCount[c]||0)+1;});
    it.tg.forEach(function(t){tagCount[t]=(tagCount[t]||0)+1;});
  });

  // 상태: 단일 선택자 (all | cat | tag | aidong)
  var sel={kind:"all",key:null}, q="", sort="id";
  var filtered=[], shown=0, BATCH=80;
  var grid=document.getElementById("grid"), sentinel=document.getElementById("sentinel"), countEl=document.getElementById("count");

  function match(it){
    if(sel.kind==="cat"  && it.cat.indexOf(sel.key)<0) return false;
    if(sel.kind==="tag"  && it.tg.indexOf(sel.key)<0) return false;
    if(sel.kind==="aidong" && it.ad.indexOf(sel.key)<0) return false;
    if(q){var s=q.toLowerCase(); if(it.nm.toLowerCase().indexOf(s)<0 && it.id.toLowerCase().indexOf(s)<0) return false;}
    return true;
  }
  function applyFilter(){
    filtered=ITEMS.filter(match);
    filtered.sort(function(a,b){
      if(sort==="name") return a.nm.localeCompare(b.nm,"ko");
      if(sort==="rare") return (b.gr-a.gr)||(a.rf-b.rf)||a.id.localeCompare(b.id);
      if(sort==="ref")  return (b.rf-a.rf)||a.id.localeCompare(b.id);
      return a.id.localeCompare(b.id);
    });
    grid.innerHTML=""; shown=0;
    countEl.textContent="총 "+filtered.length.toLocaleString()+"개";
    updateBack();
    if(!filtered.length){grid.innerHTML='<div class="empty">결과가 없습니다.</div>';return;}
    renderMore();
  }
  function cardHtml(it){
    var lead=catC(it.cat[0]), G=GRADE[it.gr];
    var catChips=it.cat.map(catChip).join("");
    // 본문 태그: 소장템 우선 + 앞쪽 2개
    var shownTags=[]; if(it.tg.indexOf("소장템")>=0) shownTags.push("소장템");
    it.tg.forEach(function(t){if(t!=="소장템"&&shownTags.length<3)shownTags.push(t);});
    var more=it.tg.length-shownTags.length;
    var tagHtml=shownTags.map(tagChip).join("")+(more>0?'<span class="more">+'+more+'</span>':'');
    return '<article class="card" data-id="'+it.id+'" style="'+accent(lead)+gvars(it.gr)+'">'
      +'<div class="card__top"><div class="tags">'+catChips+'</div>'
        +'<span class="grade"><span class="gem">'+G.g+'</span>'+G.t+'</span></div>'
      +'<div class="art"><span class="tw a"></span><span class="tw b"></span>'
        +'<img src="assets/thumb/'+it.im+'" srcset="assets/mini/'+it.im+' 96w, assets/thumb/'+it.im+' 320w" sizes="(max-width:560px) 60px, 200px" alt="'+esc(it.nm)+'" loading="lazy" /></div>'
      +'<div class="card__body"><h3 class="name">'+esc(it.nm)+'</h3>'
        +'<p class="sub2">'+esc(tail(it.pt))+'</p>'
        +'<div class="tags small">'+tagHtml+'</div></div></article>';
  }
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
      +(dot&&color?'<i style="background:'+color+'"></i>':'')+(emoji?emoji+" ":"")+label
      +(cnt!=null?'<span class="n">'+cnt.toLocaleString()+'</span>':'')+'</span>';
  }
  function formTagsByCount(min){ // 형태 태그 (count>=min) 카운트 내림차순
    return Object.keys(tagCount).filter(function(t){return famOf(t)==="형태"&&tagCount[t]>=min;})
      .sort(function(a,b){return tagCount[b]-tagCount[a];});
  }
  function renderNav(){
    var cat='<span class="grouplabel">📂 분류</span>'+chip("전체보기","all",null,"#3a4150","",ITEMS.length,false);
    CATORDER.forEach(function(k){var d=CAT[k];cat+=chip("#"+k,"cat",k,d.c,d.e,catCount[k]||0,true);});

    var nTags=0;
    var tagrow=function(label,arr){ nTags+=arr.length; var h='<span class="famlabel">'+label+'</span>';
      arr.forEach(function(t){h+=chip("#"+t,"tag",t,tagColor(t),"",tagCount[t]||0,true);}); return '<div class="famrow">'+h+'</div>'; };
    var rows= tagrow(FAM["소장"].e+" 소장", ["소장템"])
      + tagrow(FAM["기능"].e+" 기능", FUNC.filter(function(t){return tagCount[t];}))
      + tagrow(FAM["소재"].e+" 소재", MAT.filter(function(t){return tagCount[t];}).sort(function(a,b){return tagCount[b]-tagCount[a];}))
      + tagrow(FAM["형태"].e+" 형태", formTagsByCount(10));
    var open=sel.kind==="tag"; // 태그 선택 중이면 펼친 채로
    var tg='<div class="tags-head"><span class="grouplabel">🏷️ 태그</span>'
      + '<button type="button" class="tags-toggle" id="tagsToggle">'+(open?'▴ 태그 접기':'▾ 태그 더보기 ('+nTags+')')+'</button></div>'
      + '<div class="tags-body">'+rows+'</div>';

    filterBox.innerHTML='<div class="chipgroup">'+cat+'</div><div class="chipgroup tags-group'+(open?" open":"")+'">'+tg+'</div>';

    // 설명문
    if(sel.kind==="cat"&&CAT[sel.key]){tagdesc.hidden=false;tagdesc.innerHTML='<b style="color:'+CAT[sel.key].c+'">#'+esc(sel.key)+'</b> — '+esc(CAT[sel.key].d);}
    else if(sel.kind==="tag"&&sel.key==="소장템"){tagdesc.hidden=false;tagdesc.innerHTML='<b style="color:#5B8DEF">#소장템</b> — 아이동 도감에 수록되는 전용 수집품. 도감 25칸 중 20칸이 이 전용 소장템으로 채워집니다.';}
    else if(sel.kind==="aidong"){tagdesc.hidden=false;tagdesc.innerHTML='<b style="color:#E0729B">🐾 '+esc(AIDONG[sel.key])+'</b> 의 도감 — 이 아이동이 품은 아이템 '+filtered.length+'종.';}
    else tagdesc.hidden=true;
  }
  filterBox.addEventListener("click",function(e){
    var tog=e.target.closest(".tags-toggle");
    if(tog){var g=filterBox.querySelector(".tags-group");var op=g.classList.toggle("open");
      tog.textContent=op?"▴ 태그 접기":"▾ 태그 더보기";return;}
    var c=e.target.closest(".chip");if(!c)return;
    sel={kind:c.dataset.k,key:c.dataset.k==="all"?null:c.dataset.v};
    if(sel.kind!=="aidong"){var asel=document.getElementById("aidongSel");if(asel)asel.value="-1";}
    applyFilter();renderNav();window.scrollTo({top:0,behavior:"smooth"});});

  // 아이동 도감 (상시)
  function renderSub(){
    var opts='<option value="-1">아이동 선택 (671)</option>';
    for(var i=0;i<AIDONG.length;i++)opts+='<option value="'+i+'"'+(sel.kind==="aidong"&&sel.key===i?" selected":"")+'>'+esc(AIDONG[i])+'</option>';
    subBox.hidden=false;
    subBox.innerHTML='<span class="sublabel">🐾 아이동 도감</span><select id="aidongSel">'+opts+'</select><span class="subhint">아이동을 고르면 그 도감의 아이템만</span>';
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

  function famGroup(it){
    var groups={"기능":[],"소재":[],"형태":[],"소장":[]};
    it.tg.forEach(function(t){groups[famOf(t)].push(t);});
    var order=["소장","기능","소재","형태"],h="";
    order.forEach(function(f){ if(groups[f].length) h+='<div class="ir"><span class="k">'+FAM[f].e+' '+f+'</span><span class="v"><div class="tags">'+groups[f].map(function(t){return tagChip(t,true);}).join("")+'</div></span></div>'; });
    return h;
  }
  function showDetail(it){
    var lead=catC(it.cat[0]),G=GRADE[it.gr];
    var catChips=it.cat.map(function(c){return catChip(c,true);}).join("");
    var aidongRow=""; if(it.ad&&it.ad.length){
      aidongRow='<div class="ir"><span class="k">🐾 수집 아이동</span><span class="v aidong">'
        +it.ad.map(function(i){return '<span class="ad" data-navk="aidong" data-navv="'+i+'">'+esc(AIDONG[i])+'</span>';}).join("")+'</span></div>';}
    var diff=it.on&&it.on!==it.nm;
    detail.setAttribute("style",accent(lead)+gvars(it.gr));
    detail.innerHTML='<div class="detail__hero"><div class="row"><div class="tags">'+catChips+'</div>'
        +'<span class="grade"><span class="gem">'+G.g+'</span>'+G.t+'</span></div>'
        +'<div class="detail__art"><span class="tw a"></span><span class="tw b"></span><img src="assets/thumb/'+it.im+'" alt="'+esc(it.nm)+'"/></div>'
        +'<h2 class="objname">'+esc(it.on||it.nm)+'</h2>'+(it.ipa?'<div class="ipa">['+esc(it.ipa)+']</div>':'')
      +'</div>'
      +'<div class="detail__body">'
        +'<div class="fullname">'+(diff?'<span class="fnlabel">정식명</span> ':'')+esc(it.nm)+'<span class="id">'+it.id+'</span></div>'
        +(it.de?'<p class="lore">'+esc(it.de)+'</p>':'<div class="lore tbd">설명 준비중</div>')
        +'<div class="info">'
          +'<div class="ir"><span class="k">📂 분류</span><span class="v"><div class="tags">'+catChips+'</div></span></div>'
          +famGroup(it)
          +'<div class="ir"><span class="k">등급</span><span class="v"><span class="gem" style="color:'+G.c+'">'+G.g+'</span> '+G.t+'</span></div>'
          +'<div class="ir"><span class="k">도감 출현</span><span class="v">'+it.rf+'개 아이동 도감</span></div>'
          +aidongRow
          +'<div class="ir"><span class="k">아이콘</span><span class="v path">'+esc(it.im)+'</span></div>'
        +'</div><button class="detail__back" id="detailBack">← 돌아가기</button></div>';
    detailView.hidden=false; listView.hidden=true; window.scrollTo(0,0);
    detail.querySelector("#detailBack").onclick=showList;
  }
  function showList(){ detailView.hidden=true; listView.hidden=false; window.scrollTo(0,0); }

  function updateBack(){
    if(sel.kind==="all"){ backBtn.textContent="← 위키 홈"; crumb.textContent=""; }
    else{ backBtn.textContent="← 아이템 메인";
      crumb.textContent=(sel.kind==="aidong"?("🐾 "+(AIDONG[sel.key]||"")):("#"+sel.key))+" ("+filtered.length.toLocaleString()+")"; }
  }
  // 리스트 뒤로가기: 필터중→메인 / 메인→위키홈
  backBtn.addEventListener("click",function(){
    if(sel.kind!=="all"){ sel={kind:"all",key:null}; applyFilter(); renderNav(); renderSub(); window.scrollTo(0,0); }
    else { location.href=HOME; }
  });
  dBack.addEventListener("click",showList);

  // 상세 안 분류/태그/아이동 클릭 → 해당 리스트로 이동
  detail.addEventListener("click",function(e){
    var n=e.target.closest("[data-navk]"); if(!n)return;
    var k=n.dataset.navk,v=n.dataset.navv;
    sel = k==="aidong"?{kind:"aidong",key:parseInt(v,10)}:{kind:k,key:v};
    showList(); applyFilter(); renderNav(); renderSub(); window.scrollTo(0,0);
  });
  grid.addEventListener("click",function(e){var c=e.target.closest(".card");if(c)showDetail(byId[c.dataset.id]);});
  document.addEventListener("keydown",function(e){ if(e.key==="Escape" && !detailView.hidden) showList(); });

  // init
  document.getElementById("sub").textContent="반짝 컬렉터블 · 전체 도감 "+ITEMS.length.toLocaleString()+"종";
  renderNav(); renderSub(); applyFilter();
})();
