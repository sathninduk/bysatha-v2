/* ============================================================
   The Human Repository — canvas engine
   A pannable git-graph of a life. Hover a commit, click to
   inspect. Homage to GitParallax (github.com/wolfigs/gitparallax)
   ============================================================ */

(function () {
  const canvas = document.getElementById("universe");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const tooltip = document.getElementById("uni-tooltip");

  const isDark = () => document.documentElement.dataset.theme === "dark";
  function themeC() {
    return isDark()
      ? { tick: "rgba(250,247,243,0.06)", tickText: "rgba(250,247,243,0.32)",
          dotFill: "#171716", labelBg: "rgba(17,17,16,0.92)", headText: "#ff6b4a" }
      : { tick: "rgba(17,17,16,0.07)", tickText: "rgba(17,17,16,0.40)",
          dotFill: "#fffdf9", labelBg: "rgba(250,247,243,0.95)", headText: "#e04f2e" };
  }

  /* ---------- layout constants ---------- */
  const YEAR_MIN = 2004.5, YEAR_MAX = 2027.2;
  const PX_PER_YEAR = 130;           // world units
  const LANE_GAP = 74;
  const TOP_PAD = 58;
  const R = 7;                        // commit radius

  /* ---------- world model ---------- */
  const laneY = {};
  LANES.forEach((l, i) => (laneY[l.id] = TOP_PAD + i * LANE_GAP));
  const laneColor = {};
  LANES.forEach((l) => (laneColor[l.id] = l.color));

  function dateToX(dateStr) {
    const [y, m] = dateStr.split("-").map(Number);
    return (y + (m - 1) / 12 - YEAR_MIN) * PX_PER_YEAR;
  }

  // fake-but-stable short SHA per commit
  function sha(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h.toString(16).padStart(8, "0").slice(0, 7);
  }

  const nodes = COMMITS.map((c) => ({
    ...c,
    x: dateToX(c.date),
    y: laneY[c.lane],
    sha: sha(c.title + c.date),
    color: laneColor[c.lane],
  })).sort((a, b) => a.x - b.x);

  const worldW = (YEAR_MAX - YEAR_MIN) * PX_PER_YEAR;
  const worldH = TOP_PAD + LANES.length * LANE_GAP;

  /* per-lane first/last x for drawing lane segments */
  const laneSpan = {};
  nodes.forEach((n) => {
    const s = (laneSpan[n.lane] = laneSpan[n.lane] || { min: n.x, max: n.x });
    s.min = Math.min(s.min, n.x);
    s.max = Math.max(s.max, n.x);
  });

  /* ---------- camera ---------- */
  let camX = 0;                 // world x at left edge
  let targetCamX = null;        // for intro flight
  let dpr = 1, W = 0, H = 0, scaleY = 1;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    scaleY = Math.min(1, (H - 20) / worldH);
    clampCam();
  }

  function clampCam() {
    const maxCam = Math.max(0, worldW - W);
    camX = Math.max(0, Math.min(maxCam, camX));
  }

  /* start the intro flight: from the beginning to HEAD */
  const headNode = nodes.find((n) => n.head) || nodes[nodes.length - 1];
  let introT = null;
  function startIntro() {
    camX = 0;
    introT = performance.now();
  }

  /* ---------- interaction ---------- */
  let dragging = false, lastPX = 0, moved = 0;
  let hoverNode = null;

  function worldToScreen(n) {
    return { x: n.x - camX, y: n.y * scaleY + 10 };
  }

  function pickNode(px, py) {
    let best = null, bestD = 22 * 22;
    for (const n of nodes) {
      const s = worldToScreen(n);
      const d = (s.x - px) ** 2 + (s.y - py) ** 2;
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  }

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; lastPX = e.clientX;
    introT = null; targetCamX = null;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    if (dragging) {
      const dx = e.clientX - lastPX;
      lastPX = e.clientX; moved += Math.abs(dx);
      camX -= dx; clampCam();
    } else {
      hoverNode = pickNode(px, py);
      canvas.style.cursor = hoverNode ? "pointer" : "grab";
      if (hoverNode && tooltip) {
        tooltip.style.display = "block";
        tooltip.style.left = Math.min(px + 18, W - 240) + "px";
        tooltip.style.top = py + 16 + "px";
        tooltip.innerHTML =
          `<span class="tt-sha">${hoverNode.sha}</span> ${hoverNode.title}` +
          `<span class="tt-date">${hoverNode.date}</span>`;
      } else if (tooltip) tooltip.style.display = "none";
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    dragging = false;
    if (moved < 6) {
      const rect = canvas.getBoundingClientRect();
      const n = pickNode(e.clientX - rect.left, e.clientY - rect.top);
      if (n && window.openInspector) window.openInspector(n);
    }
  });
  canvas.addEventListener("pointerleave", () => {
    hoverNode = null;
    if (tooltip) tooltip.style.display = "none";
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    introT = null; targetCamX = null;
    camX += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    clampCam();
  }, { passive: false });

  /* jump buttons */
  window.universeJump = function (where) {
    introT = null;
    targetCamX = where === "start" ? 0
      : Math.max(0, Math.min(worldW - W, headNode.x - W * 0.62));
  };

  /* ---------- drawing ---------- */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* intro flight */
    if (introT !== null) {
      const t = Math.min(1, (now - introT) / 5200);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      camX = ease * Math.max(0, Math.min(worldW - W, headNode.x - W * 0.62));
      if (t >= 1) introT = null;
    } else if (targetCamX !== null) {
      camX += (targetCamX - camX) * 0.08;
      if (Math.abs(targetCamX - camX) < 0.5) targetCamX = null;
    }

    const yOf = (laneId) => laneY[laneId] * scaleY + 10;

    /* year ticks */
    ctx.font = "11px 'JetBrains Mono', monospace";
    const TC = themeC();
    ctx.fillStyle = TC.tickText;
    ctx.strokeStyle = TC.tick;
    for (let y = 2005; y <= 2026; y++) {
      const x = (y - YEAR_MIN) * PX_PER_YEAR - camX;
      if (x < -60 || x > W + 60) continue;
      ctx.beginPath();
      ctx.moveTo(x, 4);
      ctx.lineTo(x, H - 18);
      ctx.stroke();
      ctx.fillText(String(y), x + 5, H - 8);
    }

    /* lane lines */
    LANES.forEach((l) => {
      const span = laneSpan[l.id];
      if (!span) return;
      const y = yOf(l.id);
      const x1 = span.min - camX, x2 = span.max - camX;
      const grad = ctx.createLinearGradient(x1, 0, x2, 0);
      grad.addColorStop(0, l.color + "33");
      grad.addColorStop(0.15, l.color + "88");
      grad.addColorStop(1, l.color + "88");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.max(-50, x1), y);
      ctx.lineTo(Math.min(W + 50, x2), y);
      ctx.stroke();

      /* branch label pinned left */
      const lx = Math.max(10, x1);
      if (x2 > 0) {
        ctx.font = "11px 'JetBrains Mono', monospace";
        const tw = ctx.measureText(l.label).width + 14;
        ctx.fillStyle = TC.labelBg;
        roundRect(lx, y - 21, tw, 16, 8);
        ctx.fill();
        ctx.strokeStyle = l.color + "66";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = l.color;
        ctx.fillText(l.label, lx + 7, y - 9);
      }
    });

    /* merge curves */
    nodes.forEach((n) => {
      if (!n.merge) return;
      const fromLane = n.merge.from;
      const src = [...nodes].reverse().find((m) => m.lane === fromLane && m.x <= n.x);
      if (!src) return;
      const x1 = src.x - camX, y1 = yOf(src.lane);
      const x2 = n.x - camX, y2 = yOf(n.lane);
      ctx.strokeStyle = laneColor[fromLane] + "aa";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + (x2 - x1) * 0.6, y1, x2 - (x2 - x1) * 0.4, y2, x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    /* commits */
    const pulse = 0.5 + 0.5 * Math.sin(now / 420);
    nodes.forEach((n) => {
      const x = n.x - camX, y = yOf(n.lane);
      if (x < -80 || x > W + 80) return;
      const isHover = hoverNode === n;

      /* glow */
      ctx.beginPath();
      ctx.arc(x, y, R + (isHover ? 9 : 5) + (n.head ? pulse * 4 : 0), 0, 7);
      ctx.fillStyle = n.color + (isHover ? "40" : "1e");
      ctx.fill();

      /* dot */
      ctx.beginPath();
      ctx.arc(x, y, isHover ? R + 1.5 : R, 0, 7);
      ctx.fillStyle = TC.dotFill;
      ctx.fill();
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = n.color;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, 7);
      ctx.fillStyle = n.color;
      ctx.fill();

      /* tag badge */
      if (n.tag) {
        ctx.font = "10px 'JetBrains Mono', monospace";
        const tw = ctx.measureText(n.tag).width + 12;
        ctx.fillStyle = n.color + "22";
        roundRect(x - tw / 2, y + 14, tw, 15, 7);
        ctx.fill();
        ctx.strokeStyle = n.color + "88";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = n.color;
        ctx.fillText(n.tag, x - tw / 2 + 6, y + 25);
      }

      /* HEAD marker */
      if (n.head) {
        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillStyle = TC.headText;
        ctx.fillText("⌖ YOU ARE HERE", x + 16, y - 14);
      }
    });

    requestAnimationFrame(draw);
  }

  /* ---------- boot ---------- */
  resize();
  window.addEventListener("resize", resize);
  startIntro();
  requestAnimationFrame(draw);
})();
