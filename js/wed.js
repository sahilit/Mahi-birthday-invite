/* Dil Se Invite — shared wedding-page runtime.
   Templates keep their own art and animation; everything repeatable (gate, countdown, events,
   story, gallery, travel, map, RSVP, share, music, dock) is wired from here off the content object. */
(function () {
  "use strict";
  var K = window.DSIKit;
  var W = K.W, $ = K.$, $$ = K.$$, esc = K.esc;
  var Wed = window.DSIWed = {};

  Wed.ev = function () { return W.events || []; };

  /* default event card — a template can pass its own renderer */
  Wed.eventCard = function (e, i) {
    return '<article class="wev rv' + (e.featured ? ' main' : '') + '">' +
      '<header><h3>' + esc(e.name) + '</h3><div class="when">' + esc(e.day) + (e.time ? '<span>' + esc(e.time) + '</span>' : '') + '</div></header>' +
      (e.note ? '<p>' + K.nl(e.note) + '</p>' : '') +
      '<div class="meta">' + (e.venue ? '<span>' + esc(e.venue) + '</span>' : '') + (e.dress ? '<span>' + esc(e.dress) + '</span>' : '') + '</div>' +
      '<div class="acts"><a href="' + esc(K.mapLink(e)) + '" target="_blank" rel="noopener">' + esc((W.ui && W.ui.directions) || "Directions →") + '</a>' +
      (e.start ? '<button type="button" data-ics="' + i + '">' + esc((W.ui && W.ui.calendar) || "Add to calendar +") + '</button>' : '') + '</div></article>';
  };

  Wed.events = function (el, render) {
    if (!el) return;
    var EV = Wed.ev();
    K.list(el, EV, render || Wed.eventCard);
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-ics]"); if (b) K.icsEvent(EV[+b.dataset.ics]);
    });
  };

  Wed.gallery = function (el) {
    K.list(el, (W.gallery || {}).items, function (g) {
      return '<figure><img src="' + esc(K.asset(g.image)) + '" alt="' + esc(g.caption) + '" loading="lazy">' +
        (g.caption ? '<figcaption>' + esc(g.caption) + '</figcaption>' : '') + '</figure>';
    });
  };

  Wed.travel = function (el) {
    K.list(el, (W.travel || {}).items, function (t) {
      return '<div class="wtr rv"><i>' + esc(t.icon) + '</i><div><b>' + esc(t.title) + '</b><span>' + esc(t.text) + '</span></div></div>';
    });
  };

  Wed.story = function (el) {
    K.list(el, (W.story || {}).timeline, function (t) {
      return '<li class="rv"><b>' + esc(t.year) + '</b><span><strong>' + esc(t.title) + '</strong>' + esc(t.text) + '</span></li>';
    });
  };

  Wed.venue = function () {
    var V = W.venue || {}, q = encodeURIComponent(V.map_query || V.line || (W.basics || {}).city || "");
    var d = $("#dirBtn"); if (d) d.href = V.map_link || ("https://maps.google.com/?q=" + q);
    var b = $("#loadMap"); if (b) b.addEventListener("click", function () {
      $("#map").innerHTML = '<iframe title="Venue map" loading="lazy" src="https://maps.google.com/maps?q=' + q + '&z=14&output=embed"></iframe>';
    });
  };

  /* RSVP form: #rsvpForm with fields n/a/g/p/m + #fns, #guestSel, #thanks, #thxH, #thxP */
  Wed.rsvp = function (opts) {
    opts = opts || {};
    var R = W.rsvp || {}, f = $("#rsvpForm"); if (!f) return;
    var EV = Wed.ev(), max = Math.max(1, parseInt(R.max_guests || 5, 10));
    var sel = $("#guestSel");
    if (sel) sel.innerHTML = Array.from({ length: max }, function (_, i) {
      return '<option value="' + (i + 1) + '">' + (i === 0 ? "Just me" : (i + 1) + " guests") + "</option>";
    }).join("");
    if (R.ask_functions === false || !EV.length) { var fw = $("#fnWrap"); if (fw) fw.hidden = true; }
    else K.list($("#fns"), EV, function (e) {
      return '<label><input type="checkbox" value="' + esc(e.name) + '" checked><span>' + esc(e.short || e.name) + "</span></label>";
    });
    if (R.ask_phone === false && f.p) f.p.closest("label").hidden = true;
    if (R.ask_message === false && f.m) f.m.closest("label").hidden = true;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = {
        name: f.n.value.trim(), attending: f.a.value, guests: f.g ? +f.g.value : 1,
        phone: f.p ? f.p.value.trim() : "", message: f.m ? f.m.value.trim() : "", website: f.website ? f.website.value : "",
        functions: $$("#fns input:checked").map(function (x) { return x.value; })
      };
      if (!p.name) return;
      var btn = f.querySelector("button[type=submit]"); btn.disabled = true;
      K.rsvp(p).then(function (res) {
        btn.disabled = false;
        if (!res.ok) { var er = $("#rsvpErr"); if (er) { er.textContent = res.error || "Something went wrong."; er.hidden = false; } return; }
        var n = K.first(p.name), yes = p.attending === "yes";
        var h = $("#thxH"), t = $("#thxP");
        if (h) h.textContent = yes ? "Thank you, " + n + "!" : "We'll miss you, " + n + ".";
        if (t) t.textContent = (yes ? R.thanks_yes : R.thanks_no || "").replace(/\{name\}/g, n);
        var sec = f.closest("section"); if (sec) sec.classList.add("sent");
        K.rsvpDone($("#thanks"), p);
        if (opts.done) opts.done(p);
      });
    });
  };

  /* gate → page. opts: {onEnter, onOpen, music, dock} */
  Wed.gate = function (opts) {
    opts = opts || {};
    var gate = $("#gate"), btn = $("#enter");
    function open(instant) {
      if (gate) {
        gate.classList.add("open");
        setTimeout(function () { gate.hidden = true; if (window.DSIOpen) DSIOpen.stopAll(); }, instant ? 0 : 1400);
      }
      document.body.classList.remove("locked");
      document.body.classList.add("entered");
      if (!instant) {
        if (K.track) K.track("opened");
        document.body.classList.add("intro");
        try { scrollTo(0, 0); } catch (e) {}
        /* music starts on the guest's own tap, unless the couple switched autoplay off */
        var M = W.music || {}, mb = $("[data-music]") || $("#music");
        if (mb && M.enabled !== false && M.autoplay !== false && !mb.classList.contains("playing")) setTimeout(function () { mb.click(); }, 500);
      }
      if (opts.onEnter) opts.onEnter(instant);
      setTimeout(function () { var d = $(".kit-dock"); if (d) d.classList.add("on"); }, instant ? 0 : 900);
    }
    Wed.open = open;
    if (btn) btn.addEventListener("click", function () { K.sfx("chime"); open(false); });
    if (K.skip || (W.gate && W.gate.enabled === false)) open(true);
    else document.body.classList.add("locked");
  };

  /* everything a standard page needs, in one call */
  Wed.page = function (opts) {
    opts = opts || {};
    K.bind();
    if (W.sections && W.sections.dock === false) { var d = $(".kit-dock"); if (d) d.hidden = true; }
    Wed.events($("#eventList"), opts.event);
    Wed.story($("#timeline"));
    Wed.gallery($("#gal"));
    Wed.travel($("#travelList"));
    Wed.venue();
    Wed.rsvp(opts);
    var share = $("#share") || $("[data-share]");
    if (share) share.addEventListener("click", function () { K.share((W.seo && W.seo.title) || K.names()); });
    var mb = $("#music") || $("[data-music]");
    if (mb) { if (W.music && W.music.enabled === false) mb.hidden = true; else K.music(mb, (W.music && W.music.preset) || opts.music || "sitar"); }
    /* after the template has rendered its own lists, so generated .rv items fade in too */
    setTimeout(function () { K.reveal(); }, 0);
    K.countdown(K.iso((W.basics || {}).date));
    if (opts.scratch) Wed.scratchDate(opts.scratch === true ? {} : opts.scratch);
    Wed.gate(opts);
    return Wed;
  };

  /* run a template's opening ritual only when the opening screen is actually shown */
  Wed.ritual = function (fn) {
    if (K.skip || (W.gate && W.gate.enabled === false) || !window.DSIOpen || !$("#gate")) return;
    fn(DSIOpen.init(), W.gate || {});
  };

  /* ------------------------------------------------------- scratch to reveal the date
     Turns the page's countdown into a scratch card: the date hides under a layer the guest
     rubs away — gold leaf scratched with a coin, haldi paste wiped with a fingertip, rangoli
     powder brushed aside — and the countdown only appears once the date is out.
     Needs no markup: it upgrades whatever [data-count] the design already has. */

  /* each material paints its own foil and leaves its own dust behind */
  var SD_MATERIALS = {
    gold: {
      dust: ["#F3E0B4", "#D7B269", "#B3894C"], tool: "₹", brush: 44, hint: "Scratch the gold leaf",
      paint: function (c, w, h) {
        var g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#B3894C"); g.addColorStop(.28, "#EBD49B"); g.addColorStop(.42, "#FBF1D4");
        g.addColorStop(.58, "#D8B473"); g.addColorStop(.8, "#A87F42"); g.addColorStop(1, "#E3C583");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.globalAlpha = .16; c.strokeStyle = "#7A5A28"; c.lineWidth = 1;   /* beaten-leaf hairlines */
        for (var i = -h; i < w; i += 7) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); }
        c.globalAlpha = .1; c.fillStyle = "#FFF8E2";
        for (var j = 0; j < 260; j++) c.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        c.globalAlpha = 1;
      }
    },
    haldi: {
      dust: ["#F6D46B", "#E7B10A", "#C98A06"], tool: "", brush: 52, hint: "Rub the haldi away",
      paint: function (c, w, h) {
        c.fillStyle = "#E9B61C"; c.fillRect(0, 0, w, h);
        for (var i = 0; i < 90; i++) {           /* thick paste, smeared by hand */
          c.globalAlpha = .13 + Math.random() * .2;
          c.fillStyle = Math.random() < .5 ? "#F7DA7A" : "#C98A06";
          c.beginPath(); c.arc(Math.random() * w, Math.random() * h, 14 + Math.random() * 46, 0, 6.283); c.fill();
        }
        c.globalAlpha = 1;
      }
    },
    rangoli: {
      dust: ["#F4C03A", "#E2453B", "#F2A33C", "#6FBF73", "#F7E7A6"], brush: 50, hint: "Sweep the colours aside",
      paint: function (c, w, h) {
        var g = c.createLinearGradient(0, 0, w, h);          /* a swept floor, not a flag */
        g.addColorStop(0, "#2B1430"); g.addColorStop(.55, "#3A1A2A"); g.addColorStop(1, "#241026");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        var cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2;
        var cols = ["#F4C03A", "#E2453B", "#F2A33C", "#6FBF73", "#4C7FD1", "#F7E7A6"];
        /* a rangoli laid in powder: concentric rings of soft dots */
        for (var ring = 1; ring <= 6; ring++) {
          var rr = R * (ring / 6) * 1.15, n = 8 + ring * 7, col = cols[ring % cols.length], rad = Math.max(2.5, 8 - ring * .7);
          for (var i = 0; i < n; i++) {
            var a = (i / n) * 6.283 + ring * .22;
            var x = cx + Math.cos(a) * rr * 1.35, y = cy + Math.sin(a) * rr * .8;
            var rg = c.createRadialGradient(x, y, 0, x, y, rad);
            rg.addColorStop(0, col); rg.addColorStop(.55, col); rg.addColorStop(1, "rgba(0,0,0,0)");
            c.fillStyle = rg; c.beginPath(); c.arc(x, y, rad, 0, 6.283); c.fill();
          }
        }
        var lamp = c.createRadialGradient(cx, cy, 0, cx, cy, R * .5);   /* the diya at the centre */
        lamp.addColorStop(0, "rgba(255,214,120,.95)"); lamp.addColorStop(.35, "rgba(244,160,60,.35)"); lamp.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = lamp; c.beginPath(); c.arc(cx, cy, R * .5, 0, 6.283); c.fill();
        c.globalAlpha = .45;                                  /* loose powder */
        for (var j = 0; j < 900; j++) {
          c.fillStyle = cols[(Math.random() * cols.length) | 0];
          c.beginPath(); c.arc(Math.random() * w, Math.random() * h, Math.random() * 1.7, 0, 6.283); c.fill();
        }
        c.globalAlpha = 1;
      }
    },
    confetti: {
      dust: ["#FF6B9A", "#FFC84A", "#5BC0F8", "#7BD88F", "#B98BFF"], brush: 50, hint: "Scratch off the confetti",
      paint: function (c, w, h) {
        var g = c.createLinearGradient(0, 0, w, h);          /* party foil */
        g.addColorStop(0, "#FF8FB1"); g.addColorStop(.35, "#FFD36E"); g.addColorStop(.7, "#7FD8F5"); g.addColorStop(1, "#B78BFF");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        var sheen = c.createLinearGradient(0, h, w, 0);      /* a soft foil shine across it */
        sheen.addColorStop(0, "rgba(255,255,255,0)"); sheen.addColorStop(.45, "rgba(255,255,255,.55)");
        sheen.addColorStop(.6, "rgba(255,255,255,0)");
        c.fillStyle = sheen; c.fillRect(0, 0, w, h);
        var cols = ["#FF4D88", "#FFC400", "#25B4F8", "#3FD07A", "#9B5CFF", "#FFFFFF"];
        for (var i = 0; i < 120; i++) {                      /* confetti, caught mid-air */
          c.save();
          c.translate(Math.random() * w, Math.random() * h);
          c.rotate(Math.random() * 6.283);
          c.globalAlpha = .55 + Math.random() * .45;
          c.fillStyle = cols[(Math.random() * cols.length) | 0];
          if (Math.random() < .55) c.fillRect(-4, -1.6, 8 + Math.random() * 6, 3.2 + Math.random() * 2);
          else { c.beginPath(); c.arc(0, 0, 2 + Math.random() * 2.6, 0, 6.283); c.fill(); }
          c.restore();
        }
        c.globalAlpha = 1;
      }
    },
    frost: {
      dust: ["#FFFFFF", "#DCEAF4", "#B9D3E6"], tool: "", brush: 50, hint: "Wipe the frost",
      paint: function (c, w, h) {
        var g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#EAF3FA"); g.addColorStop(1, "#C6DAE9");
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.globalAlpha = .5; c.strokeStyle = "#fff";
        for (var i = 0; i < 120; i++) {          /* ice crystals */
          var x = Math.random() * w, y = Math.random() * h, r = 3 + Math.random() * 9;
          c.beginPath();
          for (var a = 0; a < 6; a++) { c.moveTo(x, y); c.lineTo(x + Math.cos(a * 1.047) * r, y + Math.sin(a * 1.047) * r); }
          c.stroke();
        }
        c.globalAlpha = 1;
      }
    }
  };

  Wed.scratchDate = function (o) {
    o = o || {};
    var C = W.countdown || {}, B = W.basics || {};
    if (C.scratch === false) return null;                       /* switched off in the Studio */
    var count = $("[data-count]");
    if (!count || count.closest(".sd") || !document.createElement("canvas").getContext) return null;

    var mat = SD_MATERIALS[C.scratch_material || o.material] || SD_MATERIALS.gold;
    var key = "dsi.sd." + location.pathname;
    var already = false;
    try { already = sessionStorage.getItem(key) === "1"; } catch (e) {}

    /* the date, written out without touching the time zone */
    var raw = String(B.date || ""), d = new Date(raw.slice(0, 16) || Date.now());
    var loc = K.lang === "hi" ? "hi-IN" : "en-IN";
    var day = isNaN(d) ? "" : d.toLocaleDateString(loc, { weekday: "long" });
    var when = B.date_text || (isNaN(d) ? "" : d.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" }));
    /* some designs already write the weekday into the date line — don't say it twice */
    if (day && when.toLowerCase().indexOf(day.toLowerCase()) >= 0) day = "";
    var hm = raw.slice(11, 16), time = "";
    if (/^\d\d:\d\d$/.test(hm)) {
      var H = +hm.slice(0, 2), M = hm.slice(3);
      time = ((H % 12) || 12) + (M === "00" ? "" : ":" + M) + (H < 12 ? " AM" : " PM") + ((W.ui && W.ui.onwards) || " onwards");
    }

    /* "scratch_only": keep the date off the rest of the page too, so the card is the reveal */
    var secrets = [];
    if (C.scratch_only === true && !already) {
      K.$$('[data-t="basics.date_text"],[data-t="basics.date_short"]').forEach(function (el) {
        if (el.closest(".sd")) return;
        secrets.push([el, el.textContent]);
        el.textContent = "· · ·";
        el.classList.add("sd-secret");
      });
    }

    var wrap = document.createElement("div");
    wrap.className = "sd";
    wrap.innerHTML =
      '<div class="sd-card" role="button" tabindex="0" aria-label="' + esc(C.scratch_label || o.label || "Scratch to reveal the date") + '">' +
        '<div class="sd-under">' +
          (day ? '<div class="sd-day">' + esc(day) + '</div>' : '') +
          '<div class="sd-date">' + esc(when) + '</div>' +
          '<div class="sd-rule"></div>' +
          (time ? '<div class="sd-time">' + esc(time) + '</div>' : '') +
        '</div>' +
        '<canvas class="sd-foil"></canvas><canvas class="sd-dust"></canvas>' +
        '<div class="sd-hint">' + esc(C.scratch_label || o.label || mat.hint) + '</div>' +
        (mat.tool ? '<div class="sd-tool">' + esc(mat.tool) + '</div>' : '') +
      '</div>' +
      '<button class="sd-reveal" type="button">Can\'t scratch? Show me the date</button>';

    count.parentNode.insertBefore(wrap, count);
    wrap.insertBefore(count, null);
    count.classList.add("sd-count");

    var card = $(".sd-card", wrap), foil = $(".sd-foil", wrap), dustC = $(".sd-dust", wrap);
    card.setAttribute("data-mat", C.scratch_material || o.material || "gold");
    var tool = $(".sd-tool", wrap), btn = $(".sd-reveal", wrap);
    var ctx = foil.getContext("2d", { willReadFrequently: true });
    var dctx = dustC.getContext("2d");
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = 0, h = 0, down = false, last = null, moves = 0, done = false, touched = false;

    function size() {
      var r = card.getBoundingClientRect();
      if (!r.width) return;
      w = r.width; h = r.height;
      [foil, dustC].forEach(function (cv) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      mat.paint(ctx, w, h);
    }
    size();
    /* the card can still be settling (web fonts, images above it) when we first paint */
    addEventListener("resize", function () { if (!touched && !done) size(); }, { passive: true });
    setTimeout(function () { if (!touched && !done) size(); }, 500);
    /* and on some layouts it has no width at all until later — paint it the moment it does */
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        if (touched || done) { ro.disconnect(); return; }
        var r = card.getBoundingClientRect();
        if (r.width && Math.abs(r.width - w) > 1) size();
      });
      ro.observe(card);
    }

    /* dust that flies off the stroke */
    var bits = [], running = false;
    function puff(x, y) {
      if (K.reduce) return;
      for (var i = 0; i < 4; i++) bits.push({ x: x, y: y, vx: (Math.random() - .5) * 2.6, vy: -Math.random() * 2.2 - .4,
        r: 1 + Math.random() * 2.2, a: 1, c: mat.dust[(Math.random() * mat.dust.length) | 0] });
      if (!running) { running = true; requestAnimationFrame(step); }
    }
    function step() {
      dctx.clearRect(0, 0, w, h);
      for (var i = bits.length - 1; i >= 0; i--) {
        var b = bits[i];
        b.x += b.vx; b.y += b.vy; b.vy += .13; b.a -= .022;
        if (b.a <= 0) { bits.splice(i, 1); continue; }
        dctx.globalAlpha = b.a; dctx.fillStyle = b.c;
        dctx.beginPath(); dctx.arc(b.x, b.y, b.r, 0, 6.283); dctx.fill();
      }
      dctx.globalAlpha = 1;
      if (bits.length) requestAnimationFrame(step); else running = false;
    }

    function at(e) { var r = card.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function rub(a, b) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = ctx.lineJoin = "round"; ctx.lineWidth = mat.brush;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.beginPath(); ctx.arc(b[0], b[1], mat.brush / 2, 0, 6.283); ctx.fill();
    }
    function cleared() {
      var d = ctx.getImageData(0, 0, foil.width, foil.height).data, gone = 0, tot = 0;
      for (var i = 3; i < d.length; i += 4 * 31) { tot++; if (d[i] < 60) gone++; }
      return tot ? gone / tot : 1;
    }
    function open(quiet) {
      if (done) return;
      done = true;
      card.classList.add("done"); card.classList.remove("touching");
      wrap.classList.add("open");
      btn.hidden = true;
      bits.length = 0; dctx.clearRect(0, 0, w, h);
      secrets.forEach(function (s) { s[0].textContent = s[1]; s[0].classList.remove("sd-secret"); });
      try { sessionStorage.setItem(key, "1"); } catch (e) {}
      if (!quiet) { if (K.track) K.track("scratch"); try { if (navigator.vibrate) navigator.vibrate([10, 40, 18]); } catch (e) {} }
    }

    card.addEventListener("pointerdown", function (e) {
      if (done) return;
      down = touched = true; last = at(e); rub(last, last); puff(last[0], last[1]);
      card.classList.add("touching");
      if (tool) { tool.style.left = last[0] + "px"; tool.style.top = last[1] + "px"; }
      try { card.setPointerCapture(e.pointerId); } catch (x) {}
    });
    card.addEventListener("pointermove", function (e) {
      if (done) return;
      var p = at(e);
      if (tool) { tool.style.left = p[0] + "px"; tool.style.top = p[1] + "px"; }
      if (e.pointerType === "mouse" && !down) { card.classList.add("touching"); return; }
      if (!down) return;
      rub(last, p); puff(p[0], p[1]); last = p;
      if (++moves % 6 === 0 && cleared() >= .36) open();
    });
    var rubs = 0;
    function up() {
      if (!down) return;
      down = false; rubs++;
      /* generous: a good rub is enough, and after a few goes it opens anyway */
      if (!done && (cleared() >= .24 || rubs >= 5)) open();
    }
    card.addEventListener("pointerup", up);
    card.addEventListener("pointercancel", up);
    card.addEventListener("pointerleave", function () { if (!down) card.classList.remove("touching"); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
    btn.addEventListener("click", function () { open(); });

    if (already || K.skip) open(true);
    return { open: open };
  };

  /* small helpers templates reuse */
  Wed.img = function (sel, key, fallback) {
    var el = $(sel); if (!el) return;
    var v = (W.images || {})[key] || fallback;
    if (!v) { el.closest("[data-img-wrap]") && (el.closest("[data-img-wrap]").hidden = true); return; }
    el.src = K.asset(v);
  };
  Wed.parallax = function (sel, strength) {
    var els = $$(sel); if (!els.length || K.reduce) return;
    addEventListener("scroll", function () {
      var y = scrollY;
      els.forEach(function (el) { el.style.transform = "translate3d(0," + (y * (strength || 0.12)).toFixed(1) + "px,0)"; });
    }, { passive: true });
  };
  Wed.typeOut = function (el, text, speed) {
    if (!el) return; if (K.reduce) { el.textContent = text; return; }
    el.textContent = ""; var i = 0;
    (function step() { el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(step, speed || 42); })();
  };
})();
