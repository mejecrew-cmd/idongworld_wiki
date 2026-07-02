/* ============================================================
 * 아이동월드 위키 · 공유 FX 엔진 (홈·웰컴 공용)
 * 의존(있으면 사용, 없으면 폴백): GSAP, ScrollTrigger, Lenis
 * data-속성으로 강화: [data-reveal] [data-tilt] [data-magnetic]
 * ============================================================ */
(function () {
  "use strict";
  var mq = function (q) { return !!(window.matchMedia && matchMedia(q).matches); };
  var REDUCED = mq('(prefers-reduced-motion: reduce)');
  var HOVER   = mq('(hover: hover) and (pointer: fine)');
  var SMALL   = mq('(max-width: 820px)');
  var body = document.body, html = document.documentElement;

  /* ---------------- WebGL 오로라 (경량, 모바일/리듀스드 시 스킵→CSS 폴백) ---------------- */
  function initGL() {
    if (REDUCED || SMALL) return;
    var canvas = document.getElementById('fx-canvas');
    if (!canvas) return;
    var gl;
    try { gl = canvas.getContext('webgl', { antialias:false, alpha:false, depth:false })
              || canvas.getContext('experimental-webgl'); } catch (e) { return; }
    if (!gl) return;

    // 팔레트: data-theme="night"(웰컴) vs 기본 주간(홈)
    var night = canvas.getAttribute('data-theme') === 'night';
    var P = night
      ? { c1:'vec3(0.42,0.24,0.70)', c2:'vec3(0.17,0.15,0.44)', c3:'vec3(0.18,0.58,0.66)', c4:'vec3(0.62,0.24,0.60)', base:'vec3(0.08,0.06,0.17)', mix:'0.62', band:'0.07' }
      : { c1:'vec3(1.0,0.63,0.81)', c2:'vec3(0.56,0.44,0.95)', c3:'vec3(0.32,0.85,0.94)', c4:'vec3(1.0,0.83,0.57)', base:'vec3(0.98,0.97,1.0)', mix:'0.5', band:'0.05' };
    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
    var FS = [
      'precision highp float;',
      'uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;',
      'vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.0+2.0*fract(sin(p)*43758.5453);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);',
      'return mix(mix(dot(hash(i),f),dot(hash(i+vec2(1,0)),f-vec2(1,0)),u.x),',
      'mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)),dot(hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}',
      'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}',
      'void main(){vec2 uv=gl_FragCoord.xy/u_res;vec2 p=uv;p.x*=u_res.x/u_res.y;',
      'float t=u_time*0.04;vec2 m=(u_mouse/u_res-0.5)*0.5;',
      'float n=fbm(p*2.1+vec2(t,t*0.6)+m);',
      'float n2=fbm(p*3.0-vec2(t*0.7,-t)+n*0.8);',
      'vec3 c1='+P.c1+',c2='+P.c2+',c3='+P.c3+',c4='+P.c4+';',
      'vec3 col=mix(c1,c2,smoothstep(-0.2,0.8,n));',
      'col=mix(col,c3,smoothstep(0.15,0.95,n2));',
      'col=mix(col,c4,smoothstep(0.55,1.0,fbm(p*1.6+t*0.8)));',
      'float band=sin((uv.x+uv.y)*7.0+u_time*0.5+n2*3.0)*0.5+0.5;',
      'col+=band*'+P.band+';',
      'col=mix('+P.base+',col,'+P.mix+');',
      'gl_FragColor=vec4(col,1.0);}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uRes = gl.getUniformLocation(prog, 'u_res'),
        uTime = gl.getUniformLocation(prog, 'u_time'),
        uMouse = gl.getUniformLocation(prog, 'u_mouse');

    var tmouse = [0.5, 0.5], mouse = [0.5, 0.5];
    function resize() {
      var scale = 0.55; // 저해상 렌더 후 CSS 업스케일(오로라는 소프트해 티 안 남 → 성능 대폭 절감)
      canvas.width = Math.max(2, Math.floor(innerWidth * scale));
      canvas.height = Math.max(2, Math.floor(innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize, { passive:true });
    window.addEventListener('pointermove', function (e) {
      tmouse[0] = e.clientX / innerWidth * canvas.width;
      tmouse[1] = (1 - e.clientY / innerHeight) * canvas.height;
    }, { passive:true });

    var start = null, running = true;
    function frame(ts) {
      if (!running) return;
      if (start === null) start = ts;
      mouse[0] += (tmouse[0] - mouse[0]) * 0.05;
      mouse[1] += (tmouse[1] - mouse[1]) * 0.05;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (ts - start) / 1000);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', function () {
      var was = running; running = !document.hidden;
      if (running && !was) requestAnimationFrame(frame);
    });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; });
    body.classList.add('fx-gl-on');
    requestAnimationFrame(frame);
  }

  /* ---------------- Lenis 부드러운 스크롤 (기본 OFF: 네이티브 스크롤이 즉각 반응.
     html[data-smooth] 지정 시에만 사용) ---------------- */
  function initLenis() {
    if (!html.hasAttribute('data-smooth')) return;   // 렉(반응 지연) 방지 위해 기본 비활성
    if (REDUCED || !window.Lenis) return;
    try {
      var lenis = new Lenis({ lerp:0.11, wheelMultiplier:1, smoothWheel:true, smoothTouch:false });
      if (window.gsap && gsap.ticker) {
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })();
      }
      if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    } catch (e) {}
  }

  /* ---------------- GSAP 인트로 커튼 + 스크롤 리빌 (동기 연출) ---------------- */
  function initReveal(introEl) {
    var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
    if (!window.gsap) { items.forEach(function (el) { el.style.opacity = 1; }); return; }  // 인트로는 CSS가 자동 종료
    var g = window.gsap;
    if (window.ScrollTrigger) g.registerPlugin(ScrollTrigger);
    if (REDUCED) { g.set(items, { opacity:1, y:0 }); return; }

    g.set(items, { opacity:0, y:46 });
    var load = items.filter(function (e) { return e.getAttribute('data-reveal') === 'load'; });
    var onScroll = items.filter(function (e) { return e.getAttribute('data-reveal') !== 'load'; });

    // 아래 폴드: 스크롤 진입(인트로와 독립)
    onScroll.forEach(function (el) {
      if (window.ScrollTrigger) {
        g.to(el, { opacity:1, y:0, duration:0.9, ease:'power3.out', clearProps:'transform',
          scrollTrigger:{ trigger:el, start:'top 88%', once:true } });
      } else {
        g.to(el, { opacity:1, y:0, duration:0.9, ease:'power3.out', delay:1.8 });
      }
    });

    // 위 폴드 + 인트로 커튼(같은 타임라인으로 동기 → 로드 지연에도 갭 없음)
    var tl = g.timeline();
    if (introEl) {
      introEl.style.animation = 'none';   // CSS 자동 아웃 대신 JS가 커튼을 담당
      tl.set(introEl, { autoAlpha:1 })
        .to({}, { duration:0.95 })         // 마크 감상
        .to(introEl, { yPercent:-100, duration:0.9, ease:'power4.inOut',
              onComplete:function () { introEl.parentNode && introEl.parentNode.removeChild(introEl); } })
        .to(load, { opacity:1, y:0, duration:0.95, ease:'power3.out', stagger:0.12, clearProps:'transform' }, '<0.35');
    } else {
      tl.to(load, { opacity:1, y:0, duration:0.95, ease:'power3.out', stagger:0.12, clearProps:'transform', delay:0.2 });
    }
  }

  /* ---------------- 3D 틸트 + 글레어 ---------------- */
  function initTilt() {
    if (!HOVER || REDUCED) return;
    [].slice.call(document.querySelectorAll('[data-tilt]')).forEach(function (el) {
      var glare = document.createElement('span'); glare.className = 'fx-glare'; el.appendChild(glare);
      var rect = null;
      el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); el.classList.add('is-tilting'); });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height;
        var rx = (py - 0.5) * -8, ry = (px - 0.5) * 10;
        el.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px) scale(1.02)';
        el.style.setProperty('--gx', (px * 100) + '%');
        el.style.setProperty('--gy', (py * 100) + '%');
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('is-tilting'); el.style.transform = ''; rect = null; });
    });
  }

  /* ---------------- 마그네틱 CTA ---------------- */
  function initMagnetic() {
    if (!HOVER || REDUCED) return;
    [].slice.call(document.querySelectorAll('[data-magnetic]')).forEach(function (el) {
      var rect = null;
      el.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1)';
      el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
      el.addEventListener('pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var mx = e.clientX - (rect.left + rect.width / 2), my = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = 'translate(' + (mx * 0.3) + 'px,' + (my * 0.45) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; rect = null; });
    });
  }

  /* ---------------- 커스텀 커서 ---------------- */
  function initCursor() {
    if (!HOVER || REDUCED) return;
    var dot = document.querySelector('.fx-cursor-dot'), ring = document.querySelector('.fx-cursor-ring');
    if (!dot || !ring) return;
    html.classList.add('fx-cursor-on');
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
    }, { passive:true });
    (function loop() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    [].slice.call(document.querySelectorAll('a,button,[data-tilt],[data-magnetic]')).forEach(function (el) {
      el.addEventListener('pointerenter', function () { ring.classList.add('is-hover'); });
      el.addEventListener('pointerleave', function () { ring.classList.remove('is-hover'); });
    });
  }

  function safe(fn) { try { fn(); } catch (e) {} }
  function init() {
    // 인트로: 세션당 1회만(책 오가며 반복 노출 방지). reduced-motion은 CSS로 이미 숨김.
    var introEl = document.querySelector('.fx-intro'), introPlay = false;
    try {
      if (introEl && !REDUCED) {
        var seen = false; try { seen = !!sessionStorage.getItem('fxIntroSeen'); } catch (e) {}
        if (seen) { introEl.parentNode && introEl.parentNode.removeChild(introEl); }
        else { try { sessionStorage.setItem('fxIntroSeen', '1'); } catch (e) {} introPlay = true; }
      } else if (introEl) { introEl.parentNode && introEl.parentNode.removeChild(introEl); }
    } catch (e) {}
    safe(initGL); safe(initLenis);
    try { initReveal(introPlay ? introEl : null); }
    catch (e) {
      [].slice.call(document.querySelectorAll('[data-reveal]')).forEach(function (el) { el.style.opacity = 1; });
      if (introEl && introEl.parentNode) introEl.parentNode.removeChild(introEl);
    }
    safe(initTilt); safe(initMagnetic); safe(initCursor);
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
