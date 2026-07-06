/* ============================================================
   Starry night — fixed backdrop behind the whole page.
   Three parallax depth layers that respond to the pointer,
   twinkling stars, occasional bright stars with cross flares,
   and shooting stars on the night side.
   Dayside (light theme): faint pastel motes on a morning sky.
   ============================================================ */

(function () {
  const canvas = document.getElementById("space");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const isDark = () => document.documentElement.dataset.theme === "dark";

  let W = 0, H = 0, dpr = 1;
  let layers = [];          // [{depth, stars: []}]
  let meteors = [];
  let px = 0, py = 0;       // pointer parallax target (-1..1)
  let cx = 0, cy = 0;       // eased parallax

  const DEPTHS = [0.25, 0.55, 1];   // far → near

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    seed();
  }

  function seed() {
    layers = DEPTHS.map((depth) => {
      const count = Math.floor((W * H) / 11000 * depth);
      return {
        depth,
        stars: Array.from({ length: count }, () => ({
          x: Math.random() * W,
          y: Math.random() * H,
          r: (0.3 + Math.random() * 1.1) * (0.6 + depth * 0.8),
          p: Math.random() * Math.PI * 2,   // twinkle phase
          s: 0.3 + Math.random() * 0.9,     // twinkle speed
          hue: Math.random(),
          bright: Math.random() < 0.045,    // rare bright star w/ flare
        })),
      };
    });
  }

  function spawnMeteor() {
    const fromLeft = Math.random() < 0.5;
    meteors.push({
      x: fromLeft ? -30 : Math.random() * W,
      y: fromLeft ? Math.random() * H * 0.5 : -30,
      vx: 6 + Math.random() * 5,
      vy: 3 + Math.random() * 3,
      life: 1,
      hue: Math.random(),
    });
  }

  const DARK_COLORS = ["233,237,255", "56,225,255", "183,140,255", "124,140,255"];
  const LIGHT_COLORS = ["79,95,232", "8,145,178", "124,58,237"];
  const METEOR_COLORS = ["255,255,255", "160,235,255", "210,190,255"];

  window.addEventListener("pointermove", (e) => {
    px = (e.clientX / W - 0.5) * 2;
    py = (e.clientY / H - 0.5) * 2;
  }, { passive: true });

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dark = isDark();
    const palette = dark ? DARK_COLORS : LIGHT_COLORS;
    const baseA = dark ? 0.7 : 0.20;

    /* eased pointer parallax */
    cx += (px - cx) * 0.03;
    cy += (py - cy) * 0.03;

    for (const layer of layers) {
      const ox = -cx * 14 * layer.depth;
      const oy = -cy * 9 * layer.depth;
      for (const st of layer.stars) {
        const tw = 0.5 + 0.5 * Math.sin(st.p + (now / 1000) * st.s * 2);
        const rgb = palette[Math.floor(st.hue * palette.length)];
        const a = baseA * (0.35 + 0.65 * tw) * (0.5 + layer.depth * 0.5);
        const x = st.x + ox, y = st.y + oy;

        ctx.beginPath();
        ctx.arc(x, y, st.r, 0, 7);
        ctx.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
        ctx.fill();

        /* bright stars get a soft halo + cross flare (night only) */
        if (st.bright && dark) {
          ctx.beginPath();
          ctx.arc(x, y, st.r * 4, 0, 7);
          ctx.fillStyle = `rgba(${rgb},${(a * 0.16).toFixed(3)})`;
          ctx.fill();
          const f = st.r * (5 + 3 * tw);
          ctx.strokeStyle = `rgba(${rgb},${(a * 0.5).toFixed(3)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(x - f, y); ctx.lineTo(x + f, y);
          ctx.moveTo(x, y - f); ctx.lineTo(x, y + f);
          ctx.stroke();
        }
      }
    }

    /* shooting stars — night side only */
    if (dark) {
      if (meteors.length < 2 && Math.random() < 0.004) spawnMeteor();
      for (const m of meteors) {
        m.x += m.vx * 2.4;
        m.y += m.vy * 2.4;
        m.life -= 0.016;
        const rgb = METEOR_COLORS[Math.floor(m.hue * METEOR_COLORS.length)];
        const tail = 22;
        const grad = ctx.createLinearGradient(
          m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail
        );
        grad.addColorStop(0, `rgba(${rgb},${(0.9 * m.life).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * tail, m.y - m.vy * tail);
        ctx.stroke();
      }
      meteors = meteors.filter((m) => m.life > 0 && m.x < W + 60 && m.y < H + 60);
    } else {
      meteors = [];
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
})();
