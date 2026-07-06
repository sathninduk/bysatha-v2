/* ============================================================
   Theme toggle · reveal-on-scroll · section rendering ·
   commit inspector · GitHub live section + constellation
   ============================================================ */

(function () {
  /* ---------- theme ---------- */
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme");
  root.dataset.theme = (saved === "dark" || saved === "light") ? saved : "dark";

  function paintToggle() {
    if (toggle) toggle.textContent = root.dataset.theme === "dark" ? "☀" : "☾";
  }
  paintToggle();

  if (toggle) {
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", root.dataset.theme);
      paintToggle();
    });
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
    { threshold: 0.08 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- stats (count-up) ---------- */
  const statsEl = document.getElementById("stats");
  if (statsEl) {
    statsEl.innerHTML = STATS.map(
      (s) => `<div class="stat"><div class="n">${s.n}</div><div class="l">${s.label}</div></div>`
    ).join("");
  }

  /* ---------- projects — editorial index rows ---------- */
  const projEl = document.getElementById("projects");
  if (projEl) {
    projEl.innerHTML = PROJECTS.map(
      (p, i) => `
      <a class="work" href="${p.link}" target="_blank" rel="noreferrer">
        <span class="w-idx mono">${String(i + 1).padStart(2, "0")}</span>
        <div class="w-main">
          <h3>${p.name}</h3>
          <p>${p.desc}</p>
        </div>
        <div class="w-side">
          <span>${p.lang}</span>
          <span class="w-badge ${p.badge === "flagship" ? "flagship" : ""}">${p.badge}</span>
        </div>
        <span class="w-arrow">↗</span>
      </a>`
    ).join("");
  }

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- inspector ---------- */
  const insp = document.getElementById("inspector");
  const backdrop = document.getElementById("insp-backdrop");

  const laneLabel = {};
  LANES.forEach((l) => (laneLabel[l.id] = l.label));

  window.openInspector = function (node) {
    document.getElementById("insp-sha").textContent = `commit ${node.sha}`;
    document.getElementById("insp-title").textContent = node.title;
    document.getElementById("insp-meta").textContent =
      `${node.date}  ·  branch: ${laneLabel[node.lane]}` + (node.tag ? `  ·  ${node.tag}` : "");
    document.getElementById("insp-desc").textContent = node.desc || "";
    const img = document.getElementById("insp-img");
    if (node.img) {
      img.src = node.img;
      img.style.display = "block";
    } else {
      img.style.display = "none";
      img.removeAttribute("src");
    }
    insp.classList.add("open");
    backdrop.classList.add("open");
  };

  window.closeInspector = function () {
    insp.classList.remove("open");
    backdrop.classList.remove("open");
  };

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.closeInspector();
  });

  /* ============================================================
     GitHub live section (baked snapshot in js/github-data.js,
     optionally refreshed client-side from the public API —
     no token ever ships with this site)
     ============================================================ */
  if (typeof GH === "undefined") return;

  /* ---- stat cards with count-up ---- */
  const ghStats = document.getElementById("gh-stats");
  const items = [
    { n: GH.contrib.lastYearTotal, label: "contributions in the last year", id: "gh-contrib" },
    { n: GH.contrib.commits, label: "commits in the last year" },
    { n: GH.contrib.prs, label: "pull requests in the last year" },
    { n: GH.profile.publicRepos, label: "public repositories", id: "gh-repos" },
    { n: GH.profile.followers, label: "followers", id: "gh-followers" },
    { n: new Date().getFullYear() - GH.profile.since, label: "years on GitHub" },
  ];
  if (ghStats) {
    ghStats.innerHTML = items.map(
      (s) => `<div class="stat"><div class="n" ${s.id ? `id="${s.id}"` : ""} data-target="${s.n}">0</div><div class="l">${s.label}</div></div>`
    ).join("");

    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const t0 = performance.now();
        (function tick(now) {
          const t = Math.min(1, (now - t0) / 1400);
          const ease = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * ease).toLocaleString();
          if (t < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    ghStats.querySelectorAll(".n").forEach((el) => countIO.observe(el));
  }

  /* ---- contribution constellation ---- */
  const cc = document.getElementById("constellation");
  const note = document.getElementById("c-note");
  if (note) note.textContent = `${GH.contrib.lastYearTotal.toLocaleString()} contributions · last 12 months`;
  if (cc) {
    const cctx = cc.getContext("2d");
    const weeks = GH.contrib.weeks;
    const maxC = Math.max(1, ...weeks.flat());
    let stars = [];

    function build() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cc.clientWidth, h = cc.clientHeight;
      cc.width = w * dpr; cc.height = h * dpr;
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gx = w / (weeks.length + 1);
      const gy = (h - 22) / 7;
      stars = [];
      weeks.forEach((week, wi) => {
        week.forEach((count, di) => {
          if (count === 0) return;
          const jx = (Math.sin(wi * 12.9898 + di * 78.233) * 43758.5453) % 1;
          const jy = (Math.sin(wi * 39.3468 + di * 11.135) * 24634.6345) % 1;
          stars.push({
            x: gx * (wi + 0.5) + jx * gx * 0.5,
            y: 12 + gy * (di + 0.5) + jy * gy * 0.5,
            r: 0.8 + 2.6 * Math.sqrt(count / maxC),
            a: 0.35 + 0.65 * (count / maxC),
            p: Math.random() * Math.PI * 2,
            count,
          });
        });
      });
    }

    function drawCC(now) {
      const w = cc.clientWidth, h = cc.clientHeight;
      cctx.clearRect(0, 0, w, h);
      const dark = document.documentElement.dataset.theme === "dark";
      const core = dark ? "250,247,243" : "17,17,16";
      const halo = dark ? "255,107,74" : "224,79,46";
      for (const s of stars) {
        const tw = 0.7 + 0.3 * Math.sin(s.p + now / 800);
        cctx.beginPath();
        cctx.arc(s.x, s.y, s.r * 2.4, 0, 7);
        cctx.fillStyle = `rgba(${halo},${(0.10 * s.a * tw).toFixed(3)})`;
        cctx.fill();
        cctx.beginPath();
        cctx.arc(s.x, s.y, s.r, 0, 7);
        cctx.fillStyle = `rgba(${core},${(s.a * tw).toFixed(3)})`;
        cctx.fill();
      }
      requestAnimationFrame(drawCC);
    }

    build();
    window.addEventListener("resize", build);
    requestAnimationFrame(drawCC);
  }

  /* ---- language spectrum ---- */
  const LANG_COLORS = {
    JavaScript: "#f1e05a", Java: "#b07219", Python: "#3572A5", TypeScript: "#3178c6",
    Go: "#00ADD8", PHP: "#4F5D95", HTML: "#e34c26", C: "#555555",
    "Jupyter Notebook": "#DA5B0B", MDX: "#fcb32c",
  };
  const langsEl = document.getElementById("gh-langs");
  const legendEl = document.getElementById("gh-lang-legend");
  if (langsEl && legendEl) {
    const total = GH.langs.reduce((a, l) => a + l.count, 0);
    langsEl.innerHTML = GH.langs.map((l) => {
      const c = LANG_COLORS[l.name] || "#8b5cf6";
      return `<span style="width:${(100 * l.count / total).toFixed(1)}%;background:${c}"></span>`;
    }).join("");
    legendEl.innerHTML = GH.langs.map((l) => {
      const c = LANG_COLORS[l.name] || "#8b5cf6";
      return `<span><i style="background:${c}"></i>${l.name} · ${l.count}</span>`;
    }).join("");
  }

  /* ---- repo cards ---- */
  const repoEl = document.getElementById("repo-grid");
  if (repoEl) {
    repoEl.innerHTML = GH.repos.map(
      (r) => `
      <a class="repo" href="${r.url}" target="_blank" rel="noreferrer">
        <div class="r-name">${r.full}</div>
        <p>${r.desc || ""}</p>
        <div class="r-meta">
          <span>★ ${r.stars}</span><span>⑂ ${r.forks}</span><span>${r.lang || ""}</span>
        </div>
      </a>`
    ).join("");
  }

  const foot = document.getElementById("gh-foot");
  if (foot) foot.textContent = `snapshot ${GH.fetched} · live refresh via public API when available`;

  /* ---- best-effort live refresh (unauthenticated public API) ---- */
  fetch(`https://api.github.com/users/${GH.login}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((u) => {
      if (!u) return;
      const f = document.getElementById("gh-followers");
      const rp = document.getElementById("gh-repos");
      if (f) { f.dataset.target = u.followers; f.textContent = u.followers.toLocaleString(); }
      if (rp) { rp.dataset.target = u.public_repos; rp.textContent = u.public_repos.toLocaleString(); }
      if (foot) foot.textContent = `snapshot ${GH.fetched} · profile refreshed live from the GitHub API`;
    })
    .catch(() => {});
})();
