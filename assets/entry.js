/* Homepage entry: SN. in place, starfield streaks, bar fill, then fade.
   First visit plays it. Skip: click, tap, Escape, prefers-reduced-motion, ?intro=0.
   Replay: ?intro=1. */
(function () {
  var el = document.getElementById("entry");
  if (!el || document.documentElement.classList.contains("entry-skip")) {
    if (el) el.remove();
    return;
  }

  var variant = document.documentElement.getAttribute("data-intro") || "mo3";
  var isPrev = variant === "prev";
  var canvas = document.getElementById("entryCanvas");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var leaving = false;
  var raf = 0;

  var markHold = isPrev ? 1800 : 1600;
  var fadeMs = isPrev ? 550 : 700;

  try {
    sessionStorage.setItem("sn-entry-seen", "1");
  } catch (e) {}

  document.documentElement.classList.add("entry-lock");

  function resize() {
    if (!canvas || !ctx) return;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // --- mo3-inspired warp streaks (original; Sarah's palette) ---
  var streaks = [];

  function spawnStreaks() {
    streaks = [];
    var count = innerWidth < 700 ? 140 : 200;
    var reach = Math.max(innerWidth, innerHeight);
    for (var i = 0; i < count; i++) {
      streaks.push(makeStreak(reach, true));
    }
  }

  function makeStreak(reach, scatter) {
    return {
      x: (Math.random() - 0.5) * innerWidth,
      y: (Math.random() - 0.5) * innerHeight,
      z: scatter ? Math.random() * reach : reach,
      pz: 0
    };
  }

  function tickMo3() {
    if (!ctx) return;
    var w = innerWidth;
    var h = innerHeight;
    var cx = w / 2;
    var cy = h / 2;
    var reach = Math.max(w, h);
    ctx.fillStyle = "#FAFAF7";
    ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < streaks.length; i++) {
      var s = streaks[i];
      s.pz = s.z;
      s.z -= 3.4;
      if (s.z < 1) {
        streaks[i] = makeStreak(reach, false);
        s = streaks[i];
        s.pz = s.z;
      }
      var k = 120 / s.z;
      var kp = 120 / s.pz;
      var x = s.x * k + cx;
      var y = s.y * k + cy;
      var px = s.x * kp + cx;
      var py = s.y * kp + cy;
      var depth = 1 - s.z / reach;
      if (depth < 0) depth = 0;
      var a = Math.min(1, depth * 1.15);
      ctx.strokeStyle = "rgba(23, 24, 26, " + (0.07 + a * 0.3) + ")";
      ctx.lineWidth = Math.max(0.3, depth * 1.15);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    raf = requestAnimationFrame(function () { tickMo3(); });
  }

  // --- previous snowflake particles ---
  var particles = [];

  function spawnFlakes(count) {
    particles = [];
    var cx = innerWidth / 2;
    var cy = innerHeight / 2;
    var reach = Math.hypot(cx, cy);
    for (var i = 0; i < count; i++) {
      particles.push(makeFlake(cx, cy, reach, true));
    }
  }

  function makeFlake(cx, cy, reach, scatter) {
    var angle = Math.random() * Math.PI * 2;
    var dist = scatter ? 80 + Math.random() * reach : reach * (0.72 + Math.random() * 0.4);
    return {
      angle: angle,
      dist: dist,
      speed: 18 + Math.random() * 28,
      size: 3.2 + Math.random() * 4.2,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.35,
      alpha: 0.08 + Math.random() * 0.14,
      arms: Math.random() < 0.55 ? 6 : 4
    };
  }

  function drawFlake(c, x, y, size, rot, arms, alpha) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.strokeStyle = "rgba(23, 24, 26, " + alpha + ")";
    c.lineWidth = 0.85;
    c.lineCap = "round";
    for (var i = 0; i < arms; i++) {
      var a = (i / arms) * Math.PI * 2;
      var dx = Math.cos(a);
      var dy = Math.sin(a);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(dx * size, dy * size);
      c.stroke();
      var mx = dx * size * 0.58;
      var my = dy * size * 0.58;
      var px = -dy * size * 0.22;
      var py = dx * size * 0.22;
      c.beginPath();
      c.moveTo(mx - px, my - py);
      c.lineTo(mx + px, my + py);
      c.stroke();
    }
    c.restore();
  }

  var last = performance.now();

  function tickPrev(now) {
    if (!ctx) return;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var w = innerWidth;
    var h = innerHeight;
    var cx = w / 2;
    var cy = h / 2;
    var reach = Math.hypot(cx, cy);
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.dist -= p.speed * dt;
      p.rot += p.rotSpeed * dt;
      if (p.dist < 56) {
        particles[i] = makeFlake(cx, cy, reach, false);
        p = particles[i];
      }
      var fade = p.dist < 90 ? (p.dist - 56) / 34 : 1;
      if (fade < 0) fade = 0;
      drawFlake(
        ctx,
        cx + Math.cos(p.angle) * p.dist,
        cy + Math.sin(p.angle) * p.dist,
        p.size,
        p.rot,
        p.arms,
        p.alpha * fade
      );
    }
    raf = requestAnimationFrame(tickPrev);
  }

  function leave() {
    if (leaving || !el) return;
    leaving = true;
    el.classList.add("is-leaving");
    window.setTimeout(finish, fadeMs);
  }

  function finish() {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("keydown", onKey);
    if (el) el.remove();
    document.documentElement.classList.remove("entry-lock");
  }

  function onKey(ev) {
    if (ev.key === "Escape") leave();
  }

  function onResize() {
    resize();
    if (isPrev) {
      spawnFlakes(innerWidth < 700 ? 42 : 70);
    } else {
      spawnStreaks();
    }
  }

  resize();
  if (isPrev) {
    spawnFlakes(innerWidth < 700 ? 42 : 70);
  } else {
    spawnStreaks();
  }

  window.addEventListener("resize", onResize);
  document.addEventListener("keydown", onKey);
  el.addEventListener("click", leave);
  el.addEventListener("touchstart", leave, { passive: true });

  function begin() {
    if (isPrev) {
      last = performance.now();
      raf = requestAnimationFrame(tickPrev);
    } else {
      raf = requestAnimationFrame(function () { tickMo3(); });
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add("is-in");
      });
    });
    window.setTimeout(leave, markHold);
  }

  if (isPrev && document.fonts && document.fonts.ready) {
    var started = false;
    var kick = function () {
      if (started) return;
      started = true;
      begin();
    };
    document.fonts.ready.then(kick);
    window.setTimeout(kick, 400);
  } else {
    begin();
  }
})();
