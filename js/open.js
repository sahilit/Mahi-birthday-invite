/* Dil Se Invite — cinematic opening engine.
   Every culture design builds its own ritual (hold a lantern, lift a dupatta, trace a kolam…) from these pieces:
   fx() particles · hold() · drag() · taps() · beats() · rub() · scratch() · trace() · complete() */
(function () {
  "use strict";
  var K = window.DSIKit, $ = K.$;
  var O = window.DSIOpen = { gate: null, done: false };

  O.vibrate = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch (e) {} };
  O.clamp = function (v) { return Math.max(0, Math.min(1, v)); };

  /* ---------------------------------------------------------------- chrome */
  O.init = function (opts) {
    opts = opts || {};
    var gate = O.gate = $("#gate");
    if (!gate) return O;
    gate.classList.add("op");
    O.onComplete = opts.onComplete;
    var skip = $("#opSkip");
    if (skip) {
      if (!skip.textContent.trim()) skip.textContent = "Skip";
      skip.addEventListener("click", function () { O.complete(true); });
    }
    var ini = K.initials();
    K.$$(".op-ini").forEach(function (el) {
      el.innerHTML = ini.length > 1 ? "<b>" + K.esc(ini[0]) + "</b><i>&amp;</i><b>" + K.esc(ini[1]) + "</b>" : "<b>" + K.esc(ini[0]) + "</b>";
    });
    return O;
  };

  O.stopAll = function () { (O._fx || []).forEach(function (f) { f.stop(); }); };

  O.progress = function (p) {
    if (O.gate) O.gate.style.setProperty("--p", O.clamp(p).toFixed(3));
  };

  O.stage = function (name) { if (O.gate) O.gate.setAttribute("data-stage", name); };

  O.complete = function (skipped) {
    if (!O.gate || O.done) return;
    O.done = true;
    O.progress(1);
    O.gate.classList.add("done");
    if (!skipped) { K.sfx("chime"); O.vibrate([12, 50, 24]); }
    if (O.onComplete) O.onComplete(!!skipped);
    setTimeout(function () {
      var b = $("#enter");
      if (b) try { b.focus({ preventScroll: true }); } catch (e) {}
    }, 1100);
  };

  /* ---------------------------------------------------------------- particles */
  O.fx = function (canvas, cfg) {
    cfg = cfg || {};
    var api = { burst: function () {}, rain: function () {}, stop: function () {} };
    if (!canvas || !canvas.getContext) return api;
    var ctx = canvas.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, H = 0, parts = [], raf = 0, running = true, rate = cfg.rain || 0, maxCount = cfg.max || 90;
    var colors = cfg.colors || ["#fff"];
    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    addEventListener("resize", size);
    var rising = function (k) { return k === "dust" || k === "sparks" || k === "bubbles"; };
    function make(x, y, o) {
      o = o || {};
      var k = o.kind || cfg.kind || "dust", sp = o.speed || 3, ang = Math.random() * Math.PI * 2;
      var p = {
        k: k, x: x, y: y, life: 0, a: 0, rot: Math.random() * 6.283, vr: (Math.random() - .5) * (o.spin || cfg.spin || .06),
        r: (o.r || cfg.r || 3) * (.55 + Math.random() * .9), c: (o.colors || colors)[Math.random() * (o.colors || colors).length | 0],
        max: o.life || cfg.life || (200 + Math.random() * 220), sway: o.sway != null ? o.sway : (cfg.sway != null ? cfg.sway : .6),
        ph: Math.random() * 100
      };
      if (o.explode) { p.vx = Math.cos(ang) * sp * (.4 + Math.random()); p.vy = Math.sin(ang) * sp * (.4 + Math.random()) - (o.lift || 0); p.drag = .965; }
      else if (o.fountain) { p.vx = (Math.random() - .5) * sp; p.vy = -(sp * (.8 + Math.random())); p.drag = .99; p.g = .08; }
      else { p.vx = (Math.random() - .5) * .5; p.vy = rising(k) ? -(.25 + Math.random() * .8) : (.5 + Math.random() * 1.3) * (cfg.fall || 1); }
      return p;
    }
    function shape(p) {
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      switch (p.k) {
        case "sparks":
        case "dust":
          ctx.shadowBlur = p.r * 4; ctx.shadowColor = p.c;
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); break;
        case "petal":
          ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.9, p.r * .95, 0, 0, 6.283); ctx.fill();
          ctx.globalAlpha = p.a * .35; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-p.r * .5, -p.r * .2, p.r * .7, p.r * .3, 0, 0, 6.283); ctx.fill(); break;
        case "rice":
          ctx.beginPath(); ctx.ellipse(0, 0, p.r * .55, p.r * 1.3, 0, 0, 6.283); ctx.fill(); break;
        case "pearl":
          var g = ctx.createRadialGradient(-p.r * .35, -p.r * .35, p.r * .1, 0, 0, p.r);
          g.addColorStop(0, "#fff"); g.addColorStop(1, p.c); ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill(); break;
        case "leaf":
          ctx.beginPath();
          for (var i = 0; i < 10; i++) { var rr = i % 2 ? p.r * .55 : p.r * 1.4, aa = i / 10 * 6.283 - 1.571; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
          ctx.closePath(); ctx.fill(); break;
        case "confetti":
          ctx.fillRect(-p.r, -p.r * .45, p.r * 2, p.r * .9); break;
        case "bubbles":
          ctx.strokeStyle = p.c; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.stroke(); break;
        default:
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }
    function tick() {
      ctx.clearRect(0, 0, W, H);
      if (rate && parts.length < maxCount && Math.random() < rate) {
        var k = cfg.kind || "dust";
        parts.push(make(Math.random() * W, rising(k) ? H + 8 : -12));
      }
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life++;
        if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
        if (p.g) p.vy += p.g;
        else if (p.drag && !rising(p.k)) p.vy += .03;
        p.x += p.vx + Math.sin((p.life + p.ph) / 38) * p.sway * .35;
        p.y += p.vy;
        p.rot += p.vr;
        var fadeIn = Math.min(1, p.life / 18), fadeOut = p.life > p.max * .72 ? Math.max(0, 1 - (p.life - p.max * .72) / (p.max * .28)) : 1;
        p.a = fadeIn * fadeOut;
        if (p.life > p.max || p.y > H + 40 || p.y < -70 || p.x < -60 || p.x > W + 60) parts.splice(i, 1);
        else shape(p);
      }
      if (running) raf = requestAnimationFrame(tick);
    }
    if (!K.reduce) tick();
    (O._fx = O._fx || []).push(api);
    api.burst = function (n, x, y, o) {
      if (K.reduce || !running) return;
      for (var i = 0; i < n; i++) parts.push(make(x == null ? Math.random() * W : x, y == null ? Math.random() * H : y, o));
    };
    api.rain = function (v) { rate = v; };
    api.stop = function () { running = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); };
    api.size = size;
    api.dims = function () { return [W, H]; };
    return api;
  };

  /* ---------------------------------------------------------------- press & hold */
  O.hold = function (el, o) {
    o = o || {};
    var p = 0, down = false, last = 0, raf = 0, done = false, ms = o.ms || 1800;
    function loop(t) {
      if (!last) last = t;
      var dt = Math.min(140, t - last); last = t;
      p = O.clamp(p + (down ? dt / ms : -dt / (ms * 1.8)));
      if (o.onProgress) o.onProgress(p);
      if (!o.silent) O.progress(p);
      if (p >= 1 && !done) { done = true; el.classList.remove("holding"); if (o.onDone) o.onDone(); raf = 0; return; }
      if (down || p > 0) raf = requestAnimationFrame(loop); else { raf = 0; last = 0; }
    }
    function start(e) {
      if (done) return;
      if (e && e.cancelable) e.preventDefault();
      down = true; el.classList.add("holding");
      if (o.onStart) o.onStart();
      if (!raf) { last = 0; raf = requestAnimationFrame(loop); }
    }
    function end() {
      if (!down) return;
      down = false; el.classList.remove("holding");
      if (o.onEnd) o.onEnd(p);
      if (!raf && p > 0 && !done) { last = 0; raf = requestAnimationFrame(loop); }
    }
    el.addEventListener("pointerdown", start);
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
    el.addEventListener("keydown", function (e) { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); });
    el.addEventListener("keyup", end);
    el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    return { value: function () { return p; }, finish: function () { p = 1; down = true; if (!raf) raf = requestAnimationFrame(loop); } };
  };

  /* ---------------------------------------------------------------- drag (a tap plays it through) */
  O.drag = function (el, o) {
    o = o || {};
    var axis = o.axis || "y", dir = o.dir || 1, p = 0, start = null, base = 0, done = false, moved = false, anim = 0;
    function dist() { return typeof o.dist === "function" ? o.dist() : (o.dist || 260); }
    function set(v) { p = O.clamp(v); if (o.onProgress) o.onProgress(p); O.progress(p); }
    function to(target, cb) {
      cancelAnimationFrame(anim);
      var from = p, t0 = performance.now(), d = target === 1 ? (o.playMs || 900) : 380;
      (function f(t) {
        var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
        set(from + (target - from) * e);
        if (k < 1) anim = requestAnimationFrame(f); else if (cb) cb();
      })(t0);
    }
    function finish() { if (done) return; done = true; el.classList.remove("dragging"); if (o.onDone) o.onDone(); }
    el.addEventListener("pointerdown", function (e) {
      if (done) return;
      cancelAnimationFrame(anim);
      start = axis === "y" ? e.clientY : e.clientX; base = p; moved = false;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      el.classList.add("dragging");
      if (o.onStart) o.onStart();
    });
    el.addEventListener("pointermove", function (e) {
      if (start == null || done) return;
      var d = ((axis === "y" ? e.clientY : e.clientX) - start);
      d = o.abs ? Math.abs(d) : d * dir;
      if (Math.abs(d) > 6) moved = true;
      set(base + d / dist());
    });
    function up() {
      if (start == null || done) return;
      start = null; el.classList.remove("dragging");
      if (!moved || p >= (o.snap || .45)) to(1, finish); else to(0);
    }
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); to(1, finish); } });
    return { play: function () { to(1, finish); } };
  };

  /* ---------------------------------------------------------------- tap each target once */
  O.taps = function (els, o) {
    o = o || {};
    var n = 0, total = els.length;
    function mark() { els.forEach(function (el, i) { el.classList.toggle("next", !!o.inOrder && i === n); }); }
    els.forEach(function (el, i) {
      el.addEventListener("click", function () {
        if (el.classList.contains("on") || n >= total) return;
        if (o.inOrder && i !== n) { el.classList.add("nope"); setTimeout(function () { el.classList.remove("nope"); }, 450); return; }
        el.classList.add("on"); n++;
        O.progress(n / total); O.vibrate(12);
        if (o.onTap) o.onTap(i, el, n, total);
        mark();
        if (n >= total && o.onDone) setTimeout(o.onDone, o.delay || 350);
      });
    });
    mark();
  };

  /* ---------------------------------------------------------------- tap the same thing N times */
  O.beats = function (el, o) {
    o = o || {};
    var n = 0, count = o.count || 6, done = false;
    function hit(e) {
      if (done) return;
      if (e && e.cancelable) e.preventDefault();
      n++; O.progress(n / count); O.vibrate(14);
      el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit");
      if (o.onBeat) o.onBeat(n, count, e);
      if (n >= count) { done = true; if (o.onDone) setTimeout(o.onDone, o.delay || 420); }
    }
    el.addEventListener("pointerdown", hit);
    el.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && !e.repeat) hit(e); });
    return { count: function () { return n; } };
  };

  /* ---------------------------------------------------------------- rub / swipe back and forth (loom, mist) */
  O.rub = function (el, o) {
    o = o || {};
    var need = o.need || function () { return innerWidth * 2.4; }, acc = 0, last = null, moved = 0, done = false;
    function total() { return typeof need === "function" ? need() : need; }
    function add(v) {
      if (done) return;
      acc += v;
      var p = O.clamp(acc / total());
      O.progress(p); if (o.onProgress) o.onProgress(p);
      if (p >= 1) { done = true; if (o.onDone) o.onDone(); }
    }
    el.addEventListener("pointerdown", function (e) { last = [e.clientX, e.clientY]; moved = 0; try { el.setPointerCapture(e.pointerId); } catch (x) {} });
    el.addEventListener("pointermove", function (e) {
      if (!last) return;
      var dx = e.clientX - last[0], dy = e.clientY - last[1], d = Math.sqrt(dx * dx + dy * dy);
      last = [e.clientX, e.clientY]; moved += d;
      add(d);
      if (o.onMove) o.onMove(e.clientX, e.clientY, dx, dy);
    });
    el.addEventListener("pointerup", function () {
      if (last && moved < 8) { add(total() * (o.tapShare || .12)); if (o.onTap) o.onTap(); }
      last = null;
    });
    el.addEventListener("pointercancel", function () { last = null; });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); add(total() * .2); } });
  };

  /* ---------------------------------------------------------------- scratch / wipe a painted layer */
  O.scratch = function (canvas, o) {
    o = o || {};
    var ctx = canvas.getContext("2d", { willReadFrequently: true }), dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, H = 0, down = false, done = false, last = null, moves = 0, brush = o.brush || 54, taps = 0;
    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      if (o.paint) o.paint(ctx, W, H);
    }
    size();
    var touched = false;
    /* repaint until the guest starts wiping: layout and web fonts can settle after the first paint */
    addEventListener("resize", function () { if (!touched && !done) size(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!touched && !done) size(); });
    setTimeout(function () { if (!touched && !done) size(); }, 600);
    function pos(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function dab(a, b) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = brush;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.beginPath(); ctx.arc(b[0], b[1], brush / 2, 0, 6.283); ctx.fill();
    }
    function cleared() {
      var d = ctx.getImageData(0, 0, canvas.width, canvas.height).data, clear = 0, tot = 0;
      for (var i = 3; i < d.length; i += 4 * 29) { tot++; if (d[i] < 60) clear++; }
      return tot ? clear / tot : 1;
    }
    function check() {
      var c = cleared(), t = o.threshold || .5;
      O.progress(c / t); if (o.onProgress) o.onProgress(O.clamp(c / t));
      if (c >= t) finish();
    }
    function finish() {
      if (done) return;
      done = true;
      canvas.classList.add("wiped");
      O.progress(1);
      if (o.onDone) o.onDone();
    }
    canvas.addEventListener("pointerdown", function (e) {
      if (done) return;
      down = true; touched = true; last = pos(e); dab(last, last);
      try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
      if (o.onStart) o.onStart();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!down || done) return;
      var p = pos(e); dab(last, p); last = p;
      if (o.onMove) o.onMove(e.clientX, e.clientY);
      if (++moves % 7 === 0) check();
    });
    function up() { if (!down) return; down = false; taps++; check(); if (!done && taps >= (o.tapsToFinish || 9)) finish(); }
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.setAttribute("tabindex", "0");
    canvas.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); finish(); } });
    return { finish: finish };
  };

  /* ---------------------------------------------------------------- trace points in order (kolam, alpona) */
  O.trace = function (svg, pts, o) {
    o = o || {};
    var NS = "http://www.w3.org/2000/svg", n = 0, done = false;
    var line = document.createElementNS(NS, "path");
    line.setAttribute("class", "op-line");
    svg.appendChild(line);
    var dots = pts.map(function (p, i) {
      var g = document.createElementNS(NS, "g");
      g.setAttribute("class", "op-dot");
      g.setAttribute("transform", "translate(" + p[0] + " " + p[1] + ")");
      g.innerHTML = '<circle class="hit" r="' + (o.hit || 22) + '"/><circle class="ring" r="' + ((o.r || 5) + 7) + '"/><circle class="core" r="' + (o.r || 5) + '"/>';
      svg.appendChild(g);
      g.addEventListener("pointerdown", function (e) { if (e.cancelable) e.preventDefault(); step(i); });
      return g;
    });
    function mark() { dots.forEach(function (d, i) { d.classList.toggle("next", i === n); }); }
    function step(i) {
      if (done) return;
      if (i !== n) { dots[i].classList.add("nope"); setTimeout(function () { dots[i].classList.remove("nope"); }, 420); return; }
      dots[i].classList.add("on"); n++;
      var d = "M" + pts.slice(0, n).map(function (p) { return p[0] + " " + p[1]; }).join(" L");
      if (o.closed && n === pts.length) d += " Z";
      line.setAttribute("d", d);
      O.progress(n / pts.length); O.vibrate(9);
      if (o.onStep) o.onStep(n, pts[i], dots[i]);
      mark();
      if (n >= pts.length) { done = true; if (o.onDone) setTimeout(o.onDone, o.delay || 300); }
    }
    svg.addEventListener("pointermove", function (e) {
      if (done || (e.pointerType === "mouse" && e.buttons !== 1)) return;
      var el = document.elementFromPoint(e.clientX, e.clientY), g = el && el.closest ? el.closest(".op-dot") : null;
      if (g && dots.indexOf(g) === n) step(n);
    });
    mark();
    return { next: function () { return n; } };
  };

  /* ---------------------------------------------------------------- where on screen is an element */
  O.center = function (el) {
    var r = el.getBoundingClientRect(), g = O.gate ? O.gate.getBoundingClientRect() : { left: 0, top: 0 };
    return [r.left - g.left + r.width / 2, r.top - g.top + r.height / 2];
  };
})();
