/* Dil Se Invite — demo wedding website kit (shared by every /demo/* site) */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var K = window.DSIKit = {
    embed: params.get("embed") === "1",
    skip: params.get("skip") === "1",
    reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  };

  /* ---------------- content binding (dynamic templates) ---------------- */
  K.W = window.WEDDING || {};
  K.MODE = window.DSI_MODE || { demo: true, base: "../../", site: "../../" };
  K.get = function (path, obj) {
    return String(path).split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj || K.W);
  };
  K.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  K.nl = function (s) { return K.esc(s).replace(/\n/g, "<br>"); };
  K.asset = function (p) {
    if (!p) return "";
    if (/^(https?:|data:|blob:|\/)/.test(p)) return p;
    return (K.MODE.base || "../../") + "assets/img/" + p.replace(/^assets\/img\//, "");
  };
  K.bind = function (root) {
    root = root || document;
    K.$$("[data-t]", root).forEach(function (el) { var v = K.get(el.dataset.t); el.textContent = v == null ? "" : v; });
    K.$$("[data-tb]", root).forEach(function (el) { el.innerHTML = K.nl(K.get(el.dataset.tb)); });
    K.$$("[data-src]", root).forEach(function (el) { var v = K.get(el.dataset.src); if (v) el.src = K.asset(v); });
    K.$$("[data-bg]", root).forEach(function (el) { var v = K.get(el.dataset.bg); if (v) el.style.backgroundImage = "url('" + K.asset(v) + "')"; });
    K.$$("[data-val]", root).forEach(function (el) { var v = K.get(el.dataset.val); if (v != null) el.setAttribute(el.dataset.attr || "placeholder", v); });
    K.$$("[data-if]", root).forEach(function (el) { var v = K.get(el.dataset.if); el.hidden = !(Array.isArray(v) ? v.length : v); });
    K.$$("[data-demo-only]", root).forEach(function (el) { el.hidden = !K.MODE.demo; });
    K.$$("[data-live-only]", root).forEach(function (el) { el.hidden = !!K.MODE.demo; });
    if (K.W.branding && K.W.branding.credit === false) K.$$(".kit-credit").forEach(function (el) { el.hidden = true; });
    K.$$("[data-section]", root).forEach(function (el) { var s = K.W.sections || {}; if (s[el.dataset.section] === false) el.hidden = true; });
    K.bindPair(root);
    if (K.W.seo && K.W.seo.title && K.MODE.demo === false) document.title = K.W.seo.title;
    if (root === document) K.arrange();
  };
  /* Section order chosen in the Studio (content.arrange = ["gallery","story",…]).
     Every [data-move] block keeps its place in the page's layout "slots"; only which block sits in which slot changes.
     Blocks missing from the saved order keep their original turn, so older websites look exactly as before. */
  K.arrange = function () {
    var order = K.W.arrange; if (!Array.isArray(order) || !order.length) return;
    var nodes = K.$$("[data-move]"); if (nodes.length < 2) return;
    var by = {}; nodes.forEach(function (n) { by[n.dataset.move] = n; });
    var seq = [];
    order.forEach(function (k) { if (by[k] && seq.indexOf(by[k]) < 0) seq.push(by[k]); });
    nodes.forEach(function (n) { if (seq.indexOf(n) < 0) seq.splice(nodes.indexOf(n), 0, n); });
    if (seq.every(function (n, i) { return n === nodes[i]; })) return;
    var slots = nodes.map(function (n) { var m = document.createComment("slot"); n.parentNode.insertBefore(m, n); return m; });
    slots.forEach(function (m, i) { m.parentNode.replaceChild(seq[i], m); });
  };

  /* Photo gallery: small square thumbnails (3 across on a phone) that open full screen, one by one, with swipe. */
  K.gallery = function (el, items, opts) {
    if (!el) return;
    items = (items || []).filter(function (g) { return g && g.image; });
    opts = opts || {};
    el.classList.add("kg");
    el.setAttribute("data-gal", "");
    el.innerHTML = items.map(function (g, i) {
      return '<button type="button" class="kg-i" data-kg="' + i + '" aria-label="' + K.esc(g.caption || "Photo " + (i + 1)) + '">' +
        '<img src="' + K.esc(K.asset(g.image)) + '" alt="' + K.esc(g.caption || "") + '" loading="lazy" decoding="async">' +
        (opts.captions && g.caption ? '<span>' + K.esc(g.caption) + '</span>' : '') + '</button>';
    }).join("");
    el.onclick = function (e) { var b = e.target.closest("[data-kg]"); if (b) K.lightbox(items, +b.dataset.kg); };
    var sec = el.closest("[data-section]");
    if (sec && !items.length) sec.hidden = true;
  };
  /* Signature gallery: big framed photos that arrive one by one as the guest scrolls — each one rises in,
     the photo unveils inside its frame and drifts gently (parallax) while it is on screen. Tap = full screen.
     opts.frame = optional frame artwork (4:5, transparent opening) laid over the photo; opts.inset = its opening. */
  K.showcase = function (el, items, opts) {
    if (!el) return;
    items = (items || []).filter(function (g) { return g && g.image; });
    opts = opts || {};
    var sec = el.closest("[data-section]");
    if (sec && !items.length) { sec.hidden = true; return; }
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    el.classList.add("sg"); el.setAttribute("data-gal", "");
    if (opts.frame) { el.classList.add("sg-art"); if (opts.inset) el.style.setProperty("--fr-in", opts.inset); }
    el.innerHTML = items.map(function (g, i) {
      return '<figure class="sg-i" style="--i:' + i + '"><button type="button" class="sg-f" data-kg="' + i + '" aria-label="' + K.esc(g.caption || "Photo " + (i + 1)) + '">' +
        '<span class="sg-p"><img src="' + K.esc(K.asset(g.image)) + '" alt="' + K.esc(g.caption || "") + '" loading="lazy" decoding="async"></span>' +
        (opts.frame ? '<img class="sg-fr" src="' + K.esc(K.asset(opts.frame)) + '" alt="" aria-hidden="true">' : '<i class="sg-c1" aria-hidden="true"></i><i class="sg-c2" aria-hidden="true"></i>') +
        '</button>' + (g.caption || opts.numbers !== false ? '<figcaption><b>' + pad(i + 1) + '</b>' + (g.caption ? '<span>' + K.esc(g.caption) + '</span>' : '') + '</figcaption>' : '') + '</figure>';
    }).join("");
    el.onclick = function (e) { var b = e.target.closest("[data-kg]"); if (b) K.lightbox(items, +b.dataset.kg); };
    var figs = K.$$(".sg-i", el);
    if (K.reduce || !("IntersectionObserver" in window)) { figs.forEach(function (f) { f.classList.add("on"); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.18 });
    figs.forEach(function (f) { io.observe(f); });
    // gentle parallax: the photo drifts inside its frame while it crosses the screen
    var imgs = K.$$(".sg-p img", el), ticking = false;
    function drift() {
      ticking = false; var h = window.innerHeight;
      imgs.forEach(function (im) {
        var r = im.parentNode.getBoundingClientRect(); if (r.bottom < -50 || r.top > h + 50) return;
        var p = ((r.top + r.height / 2) - h / 2) / h; // -0.5 … 0.5 across the screen
        im.style.setProperty("--py", (Math.max(-0.7, Math.min(0.7, p)) * -7).toFixed(2) + "%");
      });
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  };
  /* Demo pages only: remember which designs this visitor opened, and let them order this one in a tap.
     "I want this design" opens the enquiry form with the design (and the style they picked) already filled in. */
  K.wantDesign = function () {
    var key = K.MODE.template;
    if (!K.MODE.demo || !key) return;
    try {
      var seen = JSON.parse(localStorage.getItem("dsi_seen") || "[]").filter(function (x) { return x && x.k !== key; });
      seen.unshift({ k: key, t: Date.now() });
      localStorage.setItem("dsi_seen", JSON.stringify(seen.slice(0, 12)));
    } catch (e) { /* private window */ }
    function style() { var b = K.$("[data-s].on"); return b ? b.textContent.trim() : ""; }
    function link() { var st = style(); return (K.MODE.site || "../../") + "contact.html?design=" + encodeURIComponent(key) + (st ? "&style=" + encodeURIComponent(st) : ""); }
    function tick() { btn.href = link(); btn.classList.toggle("on", !document.body.classList.contains("locked") && (window.scrollY > 260 || document.documentElement.scrollHeight <= window.innerHeight + 300)); }
    window.addEventListener("scroll", tick, { passive: true });
    setInterval(tick, 1200); tick();
  };
  K.lightbox = function (items, start) {
    if (!items || !items.length) return;
    var i = start || 0, box = document.createElement("div");
    box.className = "kg-lb"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Photo");
    box.innerHTML = '<button type="button" class="kg-x" aria-label="Close">×</button><div class="kg-stage"><img alt=""></div>' +
      '<button type="button" class="kg-p" aria-label="Previous photo">‹</button><button type="button" class="kg-n" aria-label="Next photo">›</button>' +
      '<div class="kg-cap"><span class="kg-t"></span><small class="kg-c"></small></div>';
    document.body.appendChild(box);
    var img = K.$("img", box), prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    function show(n) {
      i = (n + items.length) % items.length;
      img.src = K.asset(items[i].image); img.alt = items[i].caption || "";
      K.$(".kg-t", box).textContent = items[i].caption || "";
      K.$(".kg-c", box).textContent = items.length > 1 ? (i + 1) + " / " + items.length : "";
      [items[(i + 1) % items.length], items[(i - 1 + items.length) % items.length]].forEach(function (g) { var p = new Image(); p.src = K.asset(g.image); });
    }
    function close() { document.removeEventListener("keydown", key); document.documentElement.style.overflow = prevOverflow; box.classList.remove("on"); setTimeout(function () { box.remove(); }, 200); }
    function key(e) { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") show(i + 1); else if (e.key === "ArrowLeft") show(i - 1); }
    box.addEventListener("click", function (e) {
      if (e.target.closest(".kg-x") || e.target === box || e.target.classList.contains("kg-stage")) close();
      else if (e.target.closest(".kg-n")) show(i + 1);
      else if (e.target.closest(".kg-p")) show(i - 1);
    });
    var x0 = null, y0 = 0;
    box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
    });
    document.addEventListener("keydown", key);
    if (items.length < 2) { K.$(".kg-p", box).hidden = true; K.$(".kg-n", box).hidden = true; }
    show(i);
    requestAnimationFrame(function () { box.classList.add("on"); K.$(".kg-x", box).focus(); });
    if (K.track) K.track("gallery");
  };
  /* weddings & engagements carry two names; birthdays carry one (basics.name + basics.age) */
  K.single = function () { var b = K.W.basics || {}; return !!(b.name && !b.groom && !b.bride); };
  K.pair = function () {
    var b = K.W.basics || {};
    if (K.single()) return [b.name];
    return b.order === "bride_first" ? [b.bride || "", b.groom || ""] : [b.groom || "", b.bride || ""];
  };
  K.ordinal = function (n) {
    n = parseInt(n, 10); if (isNaN(n)) return "";
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  K.names = function (sep) { return K.pair().filter(Boolean).join(sep || " & "); };
  K.initials = function () { return K.pair().map(function (n) { return (n || "").trim().charAt(0).toUpperCase(); }); };
  K.first = function (s) { return String(s || "").trim().split(/\s+/)[0]; };
  K.bindPair = function (root) {
    var p = K.pair();
    K.$$("[data-first]", root).forEach(function (el) { el.textContent = p[0]; });
    K.$$("[data-second]", root).forEach(function (el) { el.textContent = p[1]; });
    K.$$("[data-names]", root).forEach(function (el) { el.textContent = K.names(el.dataset.names || " & "); });
    var bb = K.W.basics || {}, age = bb.age != null ? bb.age : bb.years;
    K.$$("[data-age]", root).forEach(function (el) { el.textContent = age == null ? "" : age; });
    K.$$("[data-years]", root).forEach(function (el) { el.textContent = bb.years == null ? "" : bb.years; });
    K.$$("[data-ordinal]", root).forEach(function (el) { el.textContent = K.ordinal(age); });
  };
  K.list = function (el, arr, fn) { if (!el) return; el.innerHTML = (arr || []).map(fn).join(""); };
  K.mapLink = function (ev) {
    ev = ev || {};
    if (ev.map) return ev.map;
    var q = [ev.venue, ev.address, (K.W.basics || {}).city].filter(Boolean).join(", ");
    return "https://maps.google.com/?q=" + encodeURIComponent(q);
  };
  K.toUTC = function (local, addHours) {
    if (!local) return "";
    var tz = (K.W.basics && K.W.basics.tz) || "+05:30";
    var d = new Date(String(local).slice(0, 16) + ":00" + tz);
    if (isNaN(d)) return "";
    if (addHours) d = new Date(d.getTime() + addHours * 36e5);
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };
  K.iso = function (local) { var tz = (K.W.basics && K.W.basics.tz) || "+05:30"; return String(local || "").slice(0, 16) + ":00" + tz; };
  K.icsEvent = function (ev) {
    K.ics(ev.name + " · " + K.names(), K.toUTC(ev.start), ev.end ? K.toUTC(ev.end) : K.toUTC(ev.start, 3),
      [ev.venue, ev.address, (K.W.basics || {}).city].filter(Boolean).join(", "), ev.note || "");
  };
  /* RSVP: demo pages resolve locally; live client sites save to the Dil Se Invite backend */
  K.rsvp = function (payload) {
    if (K.MODE.demo || !K.MODE.rsvpUrl) return Promise.resolve({ ok: true, demo: true });
    return fetch(K.MODE.rsvpUrl, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ site: K.MODE.slug, website: "" }, payload)) })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: "Network error — please try again." }; });
  };
  K.rsvpWhatsApp = function (p) {
    var num = String(((K.W.rsvp || {}).whatsapp) || "").replace(/\D/g, "");
    if (!num) return "";
    var R = K.W.rsvp || {};
    var head = (R.wa_title || "RSVP for {names}'s wedding").replace(/\{names\}/g, K.names()).replace(/\{ordinal\}/g, K.ordinal((K.W.basics || {}).age != null ? K.W.basics.age : (K.W.basics || {}).years));
    var lines = [head, "Name: " + (p.name || ""), "Attending: " + (p.attending === "no" ? "Sorry, can't make it" : "Yes")];
    if (p.guests) lines.push("Guests: " + p.guests);
    if (p.functions && p.functions.length) lines.push("Functions: " + p.functions.join(", "));
    if (p.message) lines.push("Message: " + p.message);
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(lines.join("\n"));
  };
  K.rsvpDone = function (container, p) {
    var link = K.rsvpWhatsApp(p); if (!container || !link || K.MODE.demo) return;
    var auto = !!(K.W.rsvp || {}).wa_auto;
    var a = document.createElement("a"); a.href = link; a.target = "_blank"; a.rel = "noopener"; a.className = "kit-wa" + (auto ? " kit-wa-auto" : "");
    a.textContent = auto ? "Send my reply to the family on WhatsApp" : "Also send on WhatsApp"; container.appendChild(a);
    /* "Open WhatsApp automatically": on phones, go straight to the family's chat with the reply filled in */
    if (auto && window.matchMedia && window.matchMedia("(pointer:coarse)").matches) {
      var n = document.createElement("small"); n.className = "kit-wa-note"; n.textContent = "Opening WhatsApp — just tap send ✓"; container.appendChild(n);
      setTimeout(function () { location.href = link; }, 1400);
    }
  };

  /* reveal on scroll */
  K.reveal = function (sel) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.14 });
    K.$$(sel || ".rv").forEach(function (el) { io.observe(el); });
    return io;
  };

  /* countdown: every [data-count] gets d/h/m/s written into its <b> children */
  K.countdown = function (iso, onTick) {
    var t = new Date(iso).getTime();
    function tick() {
      var d = Math.max(0, t - Date.now());
      var v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
      K.$$("[data-count]").forEach(function (c) {
        K.$$("b", c).forEach(function (b, i) { if (i < 4) b.textContent = i === 0 ? v[0] : ("0" + v[i]).slice(-2); });
      });
      if (onTick) onTick(v);
    }
    tick(); setInterval(tick, 1000);
  };

  /* toast */
  var tt;
  K.toast = function (m) {
    var t = K.$(".kit-toast");
    if (!t) { t = document.createElement("div"); t.className = "kit-toast"; document.body.appendChild(t); }
    t.textContent = m; t.classList.add("show"); clearTimeout(tt);
    tt = setTimeout(function () { t.classList.remove("show"); }, 1900);
  };

  /* share */
  K.share = function (title) {
    var url = location.origin + location.pathname;
    if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function () { K.toast("Link copied"); }, function () { K.toast(url); }); }
    else K.toast(url);
  };

  /* calendar file */
  K.ics = function (title, start, end, loc, desc) {
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dil Se Invite//Demo//EN", "BEGIN:VEVENT",
      "UID:" + start + "-" + Math.random().toString(36).slice(2) + "@dilseinvite.in", "DTSTAMP:20260915T000000Z",
      "DTSTART:" + start, "DTEND:" + end, "SUMMARY:" + title, "LOCATION:" + loc, "DESCRIPTION:" + (desc || ""), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".ics";
    document.body.appendChild(a); a.click(); a.remove();
    K.toast("Calendar file ready");
  };

  /* generated music (no audio files, starts only on tap) */
  var ctx = null, timer = null, master = null;
  function ac() {
    if (!ctx) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ctx = new A(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); }
    ctx.resume(); return ctx;
  }
  function note(freq, when, dur, type, vol, cutoff) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type || "sine"; o.frequency.value = freq;
    f.type = "lowpass"; f.frequency.value = cutoff || 2400;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, when + Math.min(0.04, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(f); f.connect(g); g.connect(master); o.start(when); o.stop(when + dur + 0.05);
  }
  function hit(when, freq, decay, vol) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(freq * 2.2, when); o.frequency.exponentialRampToValueAtTime(freq, when + 0.08);
    g.gain.setValueAtTime(vol, when); g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + decay + 0.05);
  }
  var PRESETS = {
    drone: { every: 3600, play: function (t) { [110, 146.83, 146.83, 73.42].forEach(function (f, i) { note(f, t + i * 0.9, 3.2, "sawtooth", 0.035, 900); note(f * 2, t + i * 0.9, 2.4, "sine", 0.02); }); } },
    pad: { every: 6400, play: function (t) { [[220, 277.18, 329.63], [196, 246.94, 293.66]].forEach(function (ch, i) { ch.forEach(function (f) { note(f, t + i * 3.2, 3.6, "sine", 0.03); note(f * 2, t + i * 3.2 + 0.3, 2.2, "triangle", 0.008); }); }); [880, 1108.73, 1318.51, 1760].forEach(function (f, i) { note(f, t + 0.4 + i * 0.7, 1.6, "sine", 0.012); }); } },
    beat: { every: 2400, play: function (t) {
      var s = 0.3; [0, 3, 4, 6].forEach(function (b) { hit(t + b * s, 70, 0.35, 0.5); }); [2, 5, 7].forEach(function (b) { hit(t + b * s, 320, 0.12, 0.18); });
      [392, 440, 523.25, 440, 392, 349.23, 392, 0].forEach(function (f, i) { if (f) note(f, t + i * s, s * 0.9, "square", 0.02, 1800); }); } },
    musicbox: { every: 4800, play: function (t) { [659.25, 587.33, 523.25, 587.33, 659.25, 659.25, 659.25, 0, 587.33, 587.33, 587.33, 0, 659.25, 783.99, 783.99, 0].forEach(function (f, i) { if (f) { note(f, t + i * 0.3, 0.9, "triangle", 0.035); note(f * 2, t + i * 0.3, 0.4, "sine", 0.01); } }); } },
    sitar: { every: 4200, play: function (t) { [293.66, 329.63, 369.99, 440, 493.88, 440, 369.99, 329.63].forEach(function (f, i) { note(f, t + i * 0.45, 1.3, "sawtooth", 0.025, 1500); }); note(146.83, t, 4, "sawtooth", 0.02, 600); } }
  };
  K.music = function (btn, preset) {
    var P = PRESETS[preset] || PRESETS.drone;
    btn.addEventListener("click", function () {
      if (!ac()) return K.toast("Audio not supported");
      if (timer) { clearInterval(timer); timer = null; btn.classList.remove("playing"); btn.setAttribute("aria-pressed", "false"); return; }
      P.play(ctx.currentTime + 0.05); timer = setInterval(function () { P.play(ctx.currentTime + 0.05); }, P.every);
      btn.classList.add("playing"); btn.setAttribute("aria-pressed", "true");
    });
  };
  K.sfx = function (kind) {
    if (!ac()) return;
    var t = ctx.currentTime + 0.01;
    if (kind === "click") note(1800, t, 0.05, "square", 0.02, 4000);
    if (kind === "chime") [1318.51, 1567.98, 2093].forEach(function (f, i) { note(f, t + i * 0.09, 1.2, "sine", 0.03); });
    if (kind === "stamp") hit(t, 90, 0.25, 0.6);
    if (kind === "bell") [[622, 0.07, 4.2], [1244, 0.035, 3.2], [1717, 0.03, 2.4], [3360, 0.012, 1.4], [311, 0.03, 4.6]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p[1], t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + p[2]);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + p[2] + 0.05);
    });
    if (kind === "whoosh") { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(1800, t + 0.5); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.02, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.7); }
  };

  /* standard chrome: badge + dock + credit links respect embed mode */
  K.chrome = function (opts) {
    var badge = K.$(".kit-badge");
    if (badge && !K.MODE.demo) badge.hidden = true;
    if (badge && K.embed) { badge.textContent = "Demo · fictional names"; badge.removeAttribute("href"); }
    var dock = K.$(".kit-dock");
    if (dock) {
      var sh = K.$("[data-share]", dock); if (sh) sh.addEventListener("click", function () { K.share(opts.title); });
      var mu = K.$("[data-music]", dock); if (mu) K.music(mu, opts.music);
    }
    K.$$("[data-top-link]").forEach(function (a) { a.target = "_top"; });
  };
  K.showDock = function () { var d = K.$(".kit-dock"); if (d) d.classList.add("on"); };

  /* ---------------- analytics: what guests actually do ----------------
     Live client websites and the demo pages report to /api/beat.php — no cookies, no names, no phone numbers.
     A random number kept in this browser tells "412 opens" from "268 people". Link-preview robots never run
     this script; the Studio's own preview, thumbnail tools (?skip=1) and embedded demos (?embed=1) don't count. */
  (function () {
    var M = K.MODE, off = !!(M.preview || K.skip || K.embed || navigator.webdriver || !window.JSON || location.protocol === "file:");
    var sent = {}, q = [], timer = null, lid = rnd(8), vid = "", ret = 0, shown = 0, from = document.hidden ? 0 : Date.now();
    function rnd(n) { var s = ""; while (s.length < n) s += Math.random().toString(16).slice(2); return s.slice(0, n); }
    function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
    var where = M.demo ? location.pathname : (M.slug || "");
    if (!off) {
      vid = store("dsi_v") || ""; if (!/^[a-f0-9]{16}$/.test(vid)) { vid = rnd(16); store("dsi_v", vid); }
      ret = store("dsi_seen_" + where) ? 1 : 0; store("dsi_seen_" + where, "1");
    }
    function flush() {
      clearTimeout(timer); timer = null;
      if (!q.length) return;
      var body = JSON.stringify({ s: M.demo ? "" : (M.slug || ""), p: M.demo ? location.pathname : "", v: vid, l: lid, ret: ret,
        r: String(document.referrer || "").slice(0, 300), qr: /[?&]qr=1/.test(location.search) ? 1 : 0, e: q.splice(0, 40) });
      try { if (navigator.sendBeacon && navigator.sendBeacon("/api/beat.php", new Blob([body], { type: "text/plain" }))) return; } catch (e) {}
      try { fetch("/api/beat.php", { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(function () {}); } catch (e) {}
    }
    /* K.track(name[, value]) — each thing counts once per visit (scroll once per depth) */
    K.track = function (name, val) {
      if (off) return;
      var key = name + (name === "scroll" ? ":" + val : "");
      if (sent[key]) return; sent[key] = 1;
      q.push([name, val == null ? null : Math.round(val)]);
      if (name === "view") flush(); else if (!timer) timer = setTimeout(flush, 8000);
    };
    if (off) return;
    var lastT = 0;
    function seconds() { return (shown + (from ? Date.now() - from : 0)) / 1000; }
    function leaving() {
      var t = Math.min(3600, seconds());
      if (t >= 1 && Math.round(t) !== lastT) { lastT = Math.round(t); q = q.filter(function (x) { return x[0] !== "time"; }); q.push(["time", lastT]); }
      flush();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (from) { shown += Date.now() - from; from = 0; } leaving(); }
      else from = Date.now();
    });
    addEventListener("pagehide", leaving);
    K.track("view");

    /* got past the opening screen: every design unlocks the page by removing body.locked */
    if (window.MutationObserver && document.body) new MutationObserver(function (ms) {
      ms.forEach(function (m) { if (/(^|\s)locked(\s|$)/.test(m.oldValue || "") && !document.body.classList.contains("locked")) K.track("opened"); });
    }).observe(document.body, { attributes: true, attributeFilter: ["class"], attributeOldValue: true });

    /* how far they read */
    var tick = false;
    addEventListener("scroll", function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? scrollY / h * 100 : 100;
        [25, 50, 75, 100].forEach(function (s) { if (p >= s - 2) K.track("scroll", s); });
      });
    }, { passive: true });

    /* which parts of the invitation they reached */
    var watched = [];
    function watch() {
      if (!window.IntersectionObserver) return;
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          var id = String(e.target.id || e.target.getAttribute("data-sec") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
          if (id) K.track("sec:" + id);
          if (id === "rsvp" || id === "bo") K.track("rsvp_view");
          io.unobserve(e.target);
        });
      }, { rootMargin: "-35% 0px -35% 0px" });
      K.$$("section[id], [data-sec], #bo").forEach(function (el) { if (watched.indexOf(el) < 0) { watched.push(el); io.observe(el); } });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
    setTimeout(watch, 2500);

    /* taps worth knowing about */
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a, button, [data-music], img") : null; if (!a) return;
      var href = String(a.getAttribute("href") || "");
      if (/maps\.google|google\.[a-z.]+\/maps|maps\.app\.goo|goo\.gl\/maps|maps\.apple/.test(href) || a.id === "dirBtn" || a.id === "loadMap") K.track("map");
      else if (/^tel:/.test(href)) K.track("call");
      else if (/wa\.me|whatsapp/.test(href)) K.track("wa");
      if (a.matches("[data-music], #music")) K.track("music");
      if (a.tagName === "IMG" && a.closest("#gallery, #gal, .wgal, [data-gal]")) K.track("gallery");
    }, true);
    /* started filling the RSVP */
    document.addEventListener("input", function (e) {
      if (e.target.closest && e.target.closest("#rsvp form, #rsvpForm, #bo, #lform")) K.track("rsvp_start");
    }, true);

    /* the kit's own actions */
    var rsvp = K.rsvp, ics = K.ics, share = K.share;
    K.rsvp = function (p) { return rsvp(p).then(function (r) { if (r && r.ok) K.track("rsvp_done", p && p.attending === "no" ? 0 : 1); return r; }); };
    K.ics = function () { K.track("cal"); return ics.apply(K, arguments); };
    K.share = function () { K.track("share"); return share.apply(K, arguments); };
  })();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", K.wantDesign); else setTimeout(K.wantDesign, 0);
})();
