/* ============================================================
   Cosmic backdrop — a fixed starfield behind the whole page.
   Light theme: faint indigo motes drifting on a paper sky.
   Dark theme: white stars, twinkle, occasional shooting star.
   ============================================================ */

(function () {
  const canvas = document.getElementById("space");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const isDark = () => document.documentElement.dataset.theme === "dark";

  let W = 0, H = 0, dpr = 1;
  let stars = [];
  let meteor = null;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    seed();
  }

  function seed() {
    const count = Math.floor((W * H) / 16000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.4 + Math.random() * 1.4,
      p: Math.random() * Math.PI * 2,      // twinkle phase
      s: 0.2 + Math.random() * 0.7,        // twinkle speed
      dx: (Math.random() - 0.5) * 0.05,    // slow drift
      dy: (Math.random() - 0.5) * 0.03,
      hue: Math.random(),                  // 0..1 → indigo/violet/pink pick
    }));
  }

  function spawnMeteor() {
    meteor = {
      x: Math.random() * W * 0.7 + W * 0.2,
      y: -20,
      vx: -(2.5 + Math.random() * 2),
      vy: 4 + Math.random() * 2,
      life: 1,
    };
  }

  const LIGHT_COLORS = ["9,105,218", "130,80,223", "191,57,137"];
  const DARK_COLORS = ["230,237,243", "163,113,247", "47,129,247"];

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dark = isDark();
    const palette = dark ? DARK_COLORS : LIGHT_COLORS;
    const baseA = dark ? 0.55 : 0.22;

    for (const st of stars) {
      st.x += st.dx; st.y += st.dy;
      if (st.x < 0) st.x = W; if (st.x > W) st.x = 0;
      if (st.y < 0) st.y = H; if (st.y > H) st.y = 0;
      const tw = 0.55 + 0.45 * Math.sin(st.p + now / 900 * st.s * 2);
      const rgb = palette[Math.floor(st.hue * palette.length)];
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, 7);
      ctx.fillStyle = `rgba(${rgb},${(baseA * tw).toFixed(3)})`;
      ctx.fill();
    }

    /* shooting star — dark theme only, rare */
    if (dark) {
      if (!meteor && Math.random() < 0.0025) spawnMeteor();
      if (meteor) {
        meteor.x += meteor.vx * 3;
        meteor.y += meteor.vy * 3;
        meteor.life -= 0.02;
        const grad = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - meteor.vx * 16, meteor.y - meteor.vy * 16
        );
        grad.addColorStop(0, `rgba(255,255,255,${0.85 * meteor.life})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * 16, meteor.y - meteor.vy * 16);
        ctx.stroke();
        if (meteor.life <= 0 || meteor.y > H + 40) meteor = null;
      }
    } else {
      meteor = null;
    }

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
})();
