/* ============================================================
   Sathnindu Kottage — The Human Repository
   Career, research, open-source, community and education
   rendered as a version-controlled timeline.
   Lanes = branches. Time flows left → right (2005 → present).
   ============================================================ */

const LANES = [
  { id: "career",      label: "career",      color: "#6478ff" },
  { id: "research",    label: "research",    color: "#a855f7" },
  { id: "open-source", label: "open-source", color: "#ff7a4d" },
  { id: "community",   label: "community",   color: "#ec4899" },
  { id: "education",   label: "education",   color: "#10b981" },
];

/* date: "YYYY-MM". tag = release-style badge. head = current position.
   merge: {from: laneId} draws a merge curve from that lane's previous commit. */
const COMMITS = [
  // ---------------- education ----------------
  { lane: "education", date: "2005-01", title: "Ananda College, Colombo",
    desc: "Primary and secondary education at Ananda College, Colombo — Physical Sciences stream." },
  { lane: "education", date: "2018-08", title: "GCE Advanced Level — Physical Sciences",
    desc: "Completed Advanced Levels at Ananda College." },
  { lane: "education", date: "2022-06", title: "BSc (Hons) IT — SLIIT",
    desc: "BSc (Hons) in Information Technology, specialising in Software Engineering, at the Sri Lanka Institute of Information Technology (SLIIT)." },
  { lane: "education", date: "2024-07", title: "Higher Diploma in IT", tag: "HD-IT",
    desc: "Higher Diploma in Information Technology awarded en route to the degree." },
  { lane: "education", date: "2026-05", title: "First Class Honours", tag: "CGPA 3.74",
    desc: "Graduated with First Class Honours — CGPA 3.74 / 4.0, WGPA 3.73. Dean's List five times, with two perfect 4.0 semesters — achieved while working full-time in senior engineering roles." },

  // ---------------- community ----------------
  { lane: "community", date: "2010-06", title: "President — Anandian Astronomical Association",
    desc: "Led the school's astronomical association. Project chairman of the SACCMCT National Ceremony and co-chairman of Star Party Sri Lanka 2017." },
  { lane: "community", date: "2017-11", title: "National Astronomy Olympiad — 6 medals",
    desc: "Six-time medal winner at the Sri Lanka National Astronomy & Astrophysics Olympiad." },
  { lane: "community", date: "2024-07", title: "Secretary — SESC, SLIIT",
    desc: "Elected Secretary of the Software Engineering Student Community: responsible for the year's technical programme, inaugurations, industry meetups and community initiatives.", img: "img/sesc/inauguration.jpg" },
  { lane: "community", date: "2025-05", title: "Batch Representative — Years 3 & 4",
    desc: "Elected representative for over 100 students to the Faculty of Computing, for two consecutive years." },
  { lane: "community", date: "2025-09", title: "Hacknest Meetup series",
    desc: "Conducted the Hacknest hackathon-preparation meetup series for SLIIT engineering students.", img: "img/sesc/hacknest.jpg" },
  { lane: "community", date: "2026-01", title: "Rebuild Their Future",
    desc: "Organised a flood-relief donation programme and a school book donation drive.", img: "img/sesc/flood_relief.jpg" },
  { lane: "community", date: "2026-02", title: "GIT & GitHub 101",
    desc: "Designed and delivered a version-control fundamentals session for undergraduate engineers.", img: "img/sesc/git101.jpg" },
  { lane: "community", date: "2026-04", title: "Engineering & AI sessions",
    desc: "Delivered two technical sessions: 'Introduction to Microservices & the FractalX Framework' and 'Think Like an Engineer: Critical Thinking and AI Concepts'.", img: "img/sesc/fractalx_session.jpg" },
  { lane: "community", date: "2026-05", title: "Speaker — SESC Dev Meetup",
    desc: "Invited speaker at the SESC Dev Meetup, presenting as a Senior Software Engineer from industry.", img: "img/sesc/dev_meetup_poster.jpg" },

  // ---------------- career ----------------
  { lane: "career", date: "2018-09", title: "Audit Intern — R Kottage & Co.",
    desc: "Nine months of accounting and financial auditing with large corporate clients — an early grounding in professional discipline and the financial domain." },
  { lane: "career", date: "2020-12", title: "Software Engineer Trainee — Coduza",
    desc: "First cloud-based, industry-level projects. Promoted to a full engineering role within 12 months." },
  { lane: "career", date: "2021-12", title: "Software Engineer — Coduza",
    desc: "Production feature development with Agile delivery." },
  { lane: "career", date: "2022-02", title: "Consultant — Commercial Bank intranet",
    desc: "Led development of the official intranet of Commercial Bank PLC — one of Sri Lanka's largest private banks — via CBC Tech Solutions, in parallel with full-time work and study." },
  { lane: "career", date: "2023-02", title: "Senior Software Engineer — Coduza",
    desc: "Lead engineer across 30+ client projects. Designed and built the company's CI/CD infrastructure." },
  { lane: "career", date: "2024-06", title: "Senior Software Engineer — Code94 Labs",
    desc: "Full-stack product engineering." },
  { lane: "career", date: "2024-12", title: "FinTech Software Engineer — Arimac",
    desc: "PayLater — a Qatar-founded BNPL platform. Software architecture, mentoring, DevOps and server-level operations." },
  { lane: "career", date: "2026-03", title: "Senior FinTech Software Engineer — Arimac", head: true, tag: "HEAD",
    desc: "Leading backend engineering and DevOps teams for FinTech and BNPL products. Promoted within 16 months." },

  // ---------------- open-source ----------------
  { lane: "open-source", date: "2020-08", title: "Project CodeBase",
    desc: "Open-source stack starter kits — mernBase, pernBase, nodeAuth, tsMern and related repositories — for developers starting with full-stack JavaScript." },
  { lane: "open-source", date: "2021-08", title: "Project Evilcodes",
    desc: "Distributed-web engineering: EthPay (decentralised ERC-20 payment gateway), eth-auth (Ethereum authentication tokens), encrig (encrypted IPFS storage)." },
  { lane: "open-source", date: "2022-08", title: "DPacks",
    desc: "A database- and language-independent content management technology, evolved across multiple generations into dpacks.net." },
  { lane: "open-source", date: "2024-11", title: "ChatsAPI + ChatWithSQL",
    desc: "A high-performance AI agent framework built on SBERT & SpaCy, and a schema-constrained natural-language-to-SQL library designed for security and reliability." },
  { lane: "open-source", date: "2025-12", title: "Wolfigs", merge: { from: "research" },
    desc: "The FractalX research line merges into a new open-source family: Prism, Facet, GitParallax and Inlay — developer tooling engineered in Sri Lanka and published globally." },
  { lane: "open-source", date: "2026-06", title: "Prism approaches 1.0", tag: "212 proofs",
    desc: "A build-time topology compiler for Java/Spring: one modular monorepo, deterministically compiled to a monolith or to microservices. 212 automated proofs, Maven and Gradle plugins, Kafka event transport." },

  // ---------------- research ----------------
  { lane: "research", date: "2025-06", title: "FractalX",
    desc: "Automated migration of modular Spring Boot monoliths to production-ready microservices via AST-driven static decomposition — addressing the industry-wide cost of deferred architectural splits." },
  { lane: "research", date: "2026-05", title: "ICCTA 2026 — Vienna, Austria", tag: "published",
    desc: "First-author paper presented in person at the 12th International Conference on Computer Technology Applications, FH JOANNEUM University of Applied Sciences.", img: "img/iccta/vienna_group.jpg" },
];

/* ---------- content for page sections ---------- */

const PROJECTS = [
  { name: "Prism", lang: "Java · Spring", link: "https://github.com/wolfigs/prism",
    desc: "Build-time topology compiler: develop one modular monorepo and compile it deterministically to a monolith or to microservices. 212 automated proofs.", badge: "flagship" },
  { name: "Facet", lang: "Java · gRPC", link: "https://github.com/wolfigs/facet",
    desc: "Selective, secured runtime exposure for Spring services over gRPC — per-member OAuth 2.0 / API keys, mTLS and audit logging. A modern alternative to JMX and Actuator.", badge: "wolfigs" },
  { name: "GitParallax", lang: "Go · TypeScript", link: "https://github.com/wolfigs/gitparallax",
    desc: "A visual git interface that renders repository history as a navigable grid; merges and rebases run as animated dry runs before any real operation.", badge: "wolfigs" },
  { name: "Inlay", lang: "Go · TypeScript", link: "https://github.com/wolfigs/inlay",
    desc: "Visual in-place editing for any website: one script tag, one self-hosted binary, versioned publishing with rollback.", badge: "wolfigs" },
  { name: "ChatsAPI", lang: "Python", link: "https://github.com/chatsapi/ChatsAPI",
    desc: "High-performance AI agent framework built on SBERT & SpaCy.", badge: "ai" },
  { name: "ChatWithSQL", lang: "Python", link: "https://github.com/sathninduk/ChatWithSQL",
    desc: "Schema-constrained natural-language-to-SQL querying, engineered for security and reliability.", badge: "ai" },
  { name: "DPacks", lang: "Platform", link: "https://dpacks.net",
    desc: "Content management and web technology platform, evolved across generations since 2022.", badge: "platform" },
];

const STATS = [
  { n: "5+",     label: "years in production engineering" },
  { n: "3.74",   label: "CGPA — First Class Honours" },
  { n: "3,500+", label: "GitHub contributions ('23–'24)" },
  { n: "30+",    label: "projects led at one company" },
  { n: "1",      label: "international conference paper" },
  { n: "6",      label: "national Olympiad medals" },
];
