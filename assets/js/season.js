/* ============================================================
   ПОЛЫНЬ — клиентская логика
   - кастомный курсор
   - прогресс-бар прокрутки + reveal анимации
   - glitch-заголовки по наведению
   - счётчик онлайна (заглушка с живыми колебаниями)
   - canvas-карта мира с игроками и тултипами
   - лента событий + список игроков
   - график онлайна за 24ч
   - копирование IP
   ============================================================ */
(() => {
  "use strict";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ----------------------------------------------------------
     1. КАСТОМНЫЙ КУРСОР
     ---------------------------------------------------------- */
  const cursor = $("#cursor");
  if (cursor && matchMedia("(hover: hover)").matches) {
    const ring = $(".cursor-ring", cursor);
    const dot  = $(".cursor-dot", cursor);
    let mx = innerWidth / 2, my = innerHeight / 2;   // позиция мыши
    let rx = mx, ry = my;                            // позиция кольца (догоняет)

    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      // точка — строго под курсором, в её центре
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      cursor.classList.toggle("is-hover",
        e.target.closest("a, button, [data-copy], .feature, .about__card, .player-list li"));
    });
    addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    addEventListener("pointerup",   () => cursor.classList.remove("is-down"));

    // кольцо догоняет мышь с инерцией; в покое сходится ровно в центр точки
    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ----------------------------------------------------------
     2. ПРОГРЕСС-БАР + NAV-СОСТОЯНИЕ + REVEAL
     ---------------------------------------------------------- */
  const progress = $("#scrollProgress");
  const nav = $("#nav");

  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    if (progress) progress.style.width = (scrolled * 100) + "%";
    if (nav) nav.classList.toggle("is-scrolled", h.scrollTop > 40);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal через IntersectionObserver
  const revealTargets = $$(".about__card, .feature, .map__panel, .map__side, .online__hero, .online__side, .online__chart, .join__step, .join__ip, .hero__content");
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach((el) => io.observe(el));

  /* ----------------------------------------------------------
     3. GLITCH-ЗАГОЛОВКИ ПО НАВЕДЕНИЮ + СЛУЧАЙНЫЕ ВСПЫШКИ
     ---------------------------------------------------------- */
  $$(".glitch").forEach((el) => {
    const trigger = () => el.classList.add("is-glitching");
    const release = () => el.classList.remove("is-glitching");
    el.addEventListener("mouseenter", trigger);
    el.addEventListener("mouseleave", release);
    el.addEventListener("animationend", release);
  });

  // случайные glitch-вспышки на главном заголовке
  const heroTitle = $(".hero__title .glitch");
  if (heroTitle) {
    const flicker = () => {
      heroTitle.classList.add("is-glitching");
      setTimeout(() => heroTitle.classList.remove("is-glitching"), 300);
      setTimeout(flicker, rand(4000, 9000));
    };
    setTimeout(flicker, 3000);
  }

  /* ----------------------------------------------------------
     4. МОБИЛЬНОЕ МЕНЮ
     ---------------------------------------------------------- */
  const burger = $("#navBurger");
  const mobile = $("#navMobile");
  if (burger && mobile) {
    burger.addEventListener("click", () => {
      const open = mobile.hasAttribute("hidden");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      mobile.toggleAttribute("hidden", !open);
    });
    $$("a", mobile).forEach((a) => a.addEventListener("click", () => {
      mobile.setAttribute("hidden", "");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }));
  }

  /* ----------------------------------------------------------
     5. ДАННЫЕ ОНЛАЙНА (ЗАГЛУШКА)
     ---------------------------------------------------------- */
  const CAP = 60;
  const NAMES = [
    "WardenHunter", "nil_says", "bloodless", "Tenebrae", "molten_ivy",
    "ghost_in_chunk", "ashwalker", "v0idcaller", "pale_eye", "rust_lung",
    "hollow_bell", "screaming_at_pig", "last_torch", "door_is_open",
    "dontlookup", "krovtex", "niko_dead", "swept_away"
  ];
  const SKIN_TONES = ["#5fd068", "#c62828", "#b5651d", "#6c8e9e", "#8a8579", "#9b59b6", "#e8e2d2"];

  let online = randInt(18, 34);   // стартовое значение
  let uptimeStart = Date.now() - randInt(2, 14) * 86400000 - randInt(0, 23) * 3600000;

  // формируем список игроков из текущего онлайна
  function buildPlayerList() {
    const ul = $("#playerList");
    if (!ul) return;
    const count = Math.min(online, 8); // показываем первых 8
    const shuffled = [...NAMES].sort(() => Math.random() - 0.5).slice(0, count);
    ul.innerHTML = shuffled.map((name, i) => `
      <li>
        <span class="pl-head" style="background:${SKIN_TONES[i % SKIN_TONES.length]}">${name[0].toUpperCase()}</span>
        <span class="pl-name">${name}</span>
        <span class="pl-ping">${randInt(8, 120)} мс</span>
      </li>`).join("");
  }

  function updateOnlineUI() {
    const big = $("#bigOnline");
    const hero = $("#heroOnline");
    const navText = $("#navStatusText");
    const bar = $("#onlineBar");
    if (big) big.textContent = online;
    if (hero) hero.textContent = online;
    if (navText) navText.textContent = `Онлайн · ${online}`;
    if (bar) bar.style.width = (online / CAP * 100) + "%";

    // лёгкие колебания TPS / пинга
    const tps = $("#metaTps");
    const ping = $("#metaPing");
    if (tps)  tps.textContent = (19.4 + Math.random() * 0.6).toFixed(1);
    if (ping) ping.textContent = `${randInt(10, 28)} мс`;

    const up = $("#metaUptime");
    if (up) {
      const d = Math.floor((Date.now() - uptimeStart) / 86400000);
      const h = Math.floor(((Date.now() - uptimeStart) % 86400000) / 3600000);
      up.textContent = `${d}д ${h}ч`;
    }

    // Индикатор «близости нечто»: чем меньше народу на сервере — тем ближе.
    // 5 делений: онлайн ≥40 → 0 (далеко), ≤12 → 5 (рядом).
    const threatVal = $("#threatVal");
    const threatBars = $$(".online__hero-threat-meter span");
    if (threatVal && threatBars.length) {
      const level = clamp(5 - Math.round((online - 12) / (47 - 12) * 5), 0, 5);
      const labels = ["далеко", "далеко", "близко", "близко", "рядом", "ЗДЕСЬ"];
      threatVal.textContent = labels[level];
      threatVal.setAttribute("data-level", level >= 4 ? "high" : "low");
      threatBars.forEach((s, i) => s.classList.toggle("on", i < level));
    }
  }

  // плавно колеблем онлайн раз в 4-7 сек (список игроков не трогаем —
  // он перестраивается реже, чтобы не мигал)
  function liveOnline() {
    const delta = choice([-2, -1, 0, 0, 0, 1, 1, 2]);
    online = clamp(online + delta, 8, 47);
    updateOnlineUI();
    setTimeout(liveOnline, rand(4000, 7000));
  }

  /* ----------------------------------------------------------
     6. КАРТА МИРА (CANVAS)
     ---------------------------------------------------------- */
  const canvas = $("#worldMap");
  const tooltip = $("#mapTooltip");
  let players = [], deaths = [], nests = [];

  function genMapEntities() {
    const W = canvas.width, H = canvas.height;
    players = Array.from({ length: randInt(8, 14) }, () => ({
      x: rand(60, W - 60), y: rand(60, H - 60),
      vx: rand(-0.25, 0.25), vy: rand(-0.25, 0.25),
      name: choice(NAMES), status: choice(["идёт", "копает", "прячется", "бежит", "стоит"]),
    }));
    deaths = Array.from({ length: 7 }, () => ({
      x: rand(40, W - 40), y: rand(40, H - 40),
      name: choice(NAMES), cause: choice(["тьма", "оно", "падение", "кровь", "неизвестно"]),
    }));
    nests = [
      { x: W * 0.22, y: H * 0.68, r: 60, name: "Гнездо в катакомбах" },
      { x: W * 0.78, y: H * 0.32, r: 70, name: "Красный лес" },
      { x: W * 0.5,  y: H * 0.85, r: 50, name: "Затопленный храм" },
    ];
  }

  function drawMap() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // фон
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, W, H);

    // тонкая сетка
    ctx.strokeStyle = "rgba(46,46,58,0.4)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // «местность» — тёмные пятна-биомы
    const biomes = [
      { x: W * 0.2, y: H * 0.3, r: 120, c: "rgba(20,40,30,0.35)" },
      { x: W * 0.75, y: H * 0.4, r: 150, c: "rgba(50,30,20,0.3)" },
      { x: W * 0.5, y: H * 0.75, r: 130, c: "rgba(25,25,45,0.35)" },
    ];
    biomes.forEach((b) => {
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.c); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    });

    // гнёзда — пульсирующие ржавые зоны
    const t = Date.now() / 1000;
    nests.forEach((n) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + n.x);
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, `rgba(181,101,29,${0.18 + pulse * 0.12})`);
      g.addColorStop(0.7, "rgba(139,26,26,0.06)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      // ядро
      ctx.fillStyle = "rgba(181,101,29,0.9)";
      ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, Math.PI * 2); ctx.fill();
    });

    // зоны смерти — кресты
    deaths.forEach((d) => {
      ctx.strokeStyle = "rgba(198,40,40,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.x - 5, d.y - 5); ctx.lineTo(d.x + 5, d.y + 5);
      ctx.moveTo(d.x + 5, d.y - 5); ctx.lineTo(d.x - 5, d.y + 5);
      ctx.stroke();
    });

    // игроки — дрейф + след
    players.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 50 || p.x > W - 50) p.vx *= -1;
      if (p.y < 50 || p.y > H - 50) p.vy *= -1;

      // след
      ctx.fillStyle = "rgba(95,208,104,0.12)";
      ctx.beginPath(); ctx.arc(p.x - p.vx * 6, p.y - p.vy * 6, 3, 0, Math.PI * 2); ctx.fill();

      // ореол
      const pulse = 0.5 + 0.5 * Math.sin(t * 3 + p.x);
      ctx.fillStyle = `rgba(95,208,104,${0.15 + pulse * 0.1})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();

      // точка
      ctx.fillStyle = "#5fd068";
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill();
    });

    // виньетка карты
    const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.7);
    vg.addColorStop(0, "transparent"); vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  let mapVisible = true;
  function mapLoop() {
    if (mapVisible) drawMap();
    requestAnimationFrame(mapLoop);
  }

  // тултипы по наведению на точки
  function entityAt(mx, my) {
    for (const p of players) if (Math.hypot(p.x - mx, p.y - my) < 10) return { type: "player", ...p };
    for (const d of deaths) if (Math.hypot(d.x - mx, d.y - my) < 10) return { type: "dead", ...d };
    for (const n of nests)  if (Math.hypot(n.x - mx, n.y - my) < 12) return { type: "nest", ...n };
    return null;
  }

  if (canvas && tooltip) {
    canvas.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;
      const ent = entityAt(mx, my);
      if (ent) {
        tooltip.hidden = false;
        tooltip.style.left = e.clientX + "px";
        tooltip.style.top = e.clientY + "px";
        if (ent.type === "player") tooltip.innerHTML = `<strong>${ent.name}</strong><small>${ent.status} · в сети</small>`;
        else if (ent.type === "dead") tooltip.innerHTML = `<strong>Зона смерти</strong><small>${ent.name} — ${ent.cause}</small>`;
        else tooltip.innerHTML = `<strong>${ent.name}</strong><small>гнездо · не подходи</small>`;
      } else {
        tooltip.hidden = true;
      }
    });
    canvas.addEventListener("pointerleave", () => { tooltip.hidden = true; });
  }

  /* ----------------------------------------------------------
     7. ЛЕНТА СОБЫТИЙ
     ---------------------------------------------------------- */
  const feedEvents = [
    "{n} нашёл гнездо в катакомбах",
    "{n} не вернулся из Красного леса",
    "колокол в деревне пробил сам",
    "{n} зажёг последний факел",
    "оно вышло из стены рядом с {n}",
    "{n} слышит шаги за собой",
    "костёр вспыхнул без рук",
    "{n} нашёл имя на стене",
    "луна покраснела",
    "{n} копает в темноте",
    "дверь открылась. никого.",
    "{n} молится пустоте",
  ];
  const feed = $("#mapFeed");
  function timeLabel() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  function pushFeed() {
    if (!feed) return;
    const text = choice(feedEvents).replace("{n}", choice(NAMES));
    const li = document.createElement("li");
    li.innerHTML = `<time>${timeLabel()}</time>${text}`;
    feed.prepend(li);
    while (feed.children.length > 8) feed.removeChild(feed.lastChild);
  }

  function updateMapStats() {
    const mp = $("#mapPlayers"); if (mp) mp.textContent = players.length;
  }

  /* ----------------------------------------------------------
     8. ГРАФИК ОНЛАЙНА ЗА 24Ч (CANVAS)
     ---------------------------------------------------------- */
  const chartCanvas = $("#onlineChart");
  let chartData = [];

  function genChartData() {
    // суточная кривая с пиками вечером
    chartData = [];
    for (let h = 0; h < 24; h++) {
      const base = 10 + 22 * Math.max(0, Math.sin((h - 14) / 24 * Math.PI * 2 + 1) * 0.5 + 0.5);
      chartData.push(clamp(Math.round(base + rand(-4, 4)), 4, CAP - 5));
    }
  }

  function drawChart() {
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext("2d");
    const W = chartCanvas.width, H = chartCanvas.height;
    const pad = 14;
    ctx.clearRect(0, 0, W, H);

    // сетка
    ctx.strokeStyle = "rgba(46,46,58,0.5)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (H - pad * 2) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    }

    const max = CAP;
    const pts = chartData.map((v, i) => ({
      x: pad + (W - pad * 2) * i / (chartData.length - 1),
      y: H - pad - (H - pad * 2) * (v / max),
    }));

    // заливка
    const grad = ctx.createLinearGradient(0, pad, 0, H);
    grad.addColorStop(0, "rgba(198,40,40,0.35)");
    grad.addColorStop(1, "rgba(198,40,40,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H - pad);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H - pad);
    ctx.closePath(); ctx.fill();

    // линия
    ctx.strokeStyle = "#c62828";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(198,40,40,0.6)"; ctx.shadowBlur = 8;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
    ctx.shadowBlur = 0;

    // текущий час — точка
    const nowH = new Date().getHours();
    const cur = pts[nowH];
    if (cur) {
      ctx.fillStyle = "#ff3b3b";
      ctx.beginPath(); ctx.arc(cur.x, cur.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,59,59,0.4)";
      ctx.beginPath(); ctx.arc(cur.x, cur.y, 8 + 2 * Math.sin(Date.now()/400), 0, Math.PI * 2); ctx.stroke();
    }
  }

  let chartVisible = true;
  function chartLoop() {
    if (chartVisible) drawChart();
    requestAnimationFrame(chartLoop);
  }

  /* ----------------------------------------------------------
     9. КОПИРОВАНИЕ IP
     ---------------------------------------------------------- */
  function copyIP(text, btn, toast) {
    const done = () => {
      if (btn) { btn.classList.add("copied"); const l = $(".join__ip-copy-label", btn); if (l) l.textContent = "скопировано"; }
      if (toast) { toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 2600); }
      setTimeout(() => { if (btn) { btn.classList.remove("copied"); const l = $(".join__ip-copy-label", btn); if (l) l.textContent = "копировать"; } }, 2600);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} document.body.removeChild(ta); cb();
  }

  $$("[data-copy]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const text = el.getAttribute("data-copy");
      const isIpBtn = el.classList.contains("join__ip-copy");
      const toast = $("#ipToast");

      // для hero-кнопки меняем подсказку прямо на ней
      const heroHint = $(".btn__hint", el);
      const prevHint = heroHint ? heroHint.textContent : null;

      copyIP(text, isIpBtn ? el : null, toast);

      if (heroHint) {
        heroHint.textContent = "скопировано ✓";
        setTimeout(() => { heroHint.textContent = prevHint; }, 1800);
      }
    });
  });

  /* ----------------------------------------------------------
     10. EASTER EGG: нажми на seed в футере
     ---------------------------------------------------------- */
  const easter = $("#footerEaster");
  if (easter) {
    let clicks = 0;
    easter.addEventListener("click", () => {
      clicks++;
      easter.textContent = "seed: ─ ─ ─ ты не должен был это видеть";
      easter.style.color = "var(--blood-glow)";
      document.body.style.animation = "grain 0.15s steps(2) 6";
      setTimeout(() => { easter.style.color = ""; }, 1500);
      if (clicks >= 3) {
        easter.textContent = "ладно. seed: -7739521907128401. удачи.";
      }
    });
  }

  /* ----------------------------------------------------------
     11. ЗАПУСК
     ---------------------------------------------------------- */
  // стартовые значения
  updateOnlineUI();
  buildPlayerList();
  genMapEntities();
  updateMapStats();
  genChartData();
  pushFeed(); pushFeed(); pushFeed();

  // циклы
  liveOnline();
  mapLoop();
  chartLoop();

  // рисуем canvas только когда он на экране — экономим ресурсы
  const visObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.target === canvas) mapVisible = e.isIntersecting;
      if (e.target === chartCanvas) chartVisible = e.isIntersecting;
    });
  }, { threshold: 0.05 });
  if (canvas) visObs.observe(canvas);
  if (chartCanvas) visObs.observe(chartCanvas);

  // периодическая лента событий
  setInterval(pushFeed, 5200);
  // список игроков обновляем реже, чем онлайн — чтобы не мигал
  setInterval(buildPlayerList, 18000);
  // обновляем карту-статистику раз в 10 сек (имитация активности)
  setInterval(updateMapStats, 10000);

  // плавный скролл по якорям (с учётом фиксированной навигации)
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + scrollY - 70;
      scrollTo({ top: y, behavior: "smooth" });
    });
  });
 /* ----------------------------------------------------------
     12. TWITCH КАРУСЕЛЬ (строится из config/streams.json)
     ---------------------------------------------------------- */
  async function initTwitchCarousel() {
    const track = $("#twitchTrack");
    const prevBtn = $("#twitchPrev");
    const nextBtn = $("#twitchNext");
    if (!track) return;

    const PARENT = location.hostname || "localhost";

    let streamers = [];
    try {
      const res = await fetch("config/streams.json");
      const data = await res.json();
      streamers = data.streamers || [];
    } catch (err) {
      console.error("Не удалось загрузить streams.json для карусели", err);
    }

    if (!streamers.length) {
      track.innerHTML = `<div class="wiki-empty-hint">Пока никто не добавлен. Открой config/streams.json.</div>`;
      return;
    }

    track.innerHTML = streamers.map((s, i) => `
      <div class="twitch__slide${i === 0 ? " is-active" : ""}">
        <div class="twitch__player-container">
          <iframe src="https://player.twitch.tv/?channel=${s.twitchChannel}&parent=${PARENT}&autoplay=false" allowfullscreen loading="lazy"></iframe>
        </div>
        <div class="twitch__meta">
          <span class="twitch__streamer">${s.name}</span>
        </div>
      </div>`).join("");

    const slides = $$(".twitch__slide", track);
    if (!prevBtn || !nextBtn || slides.length < 2) return;

    let currentIndex = 0;
    const updateCarousel = (index) => {
      slides.forEach(s => s.classList.remove("is-active"));
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      slides[currentIndex].classList.add("is-active");
    };

    prevBtn.addEventListener("click", () => updateCarousel(currentIndex - 1));
    nextBtn.addEventListener("click", () => updateCarousel(currentIndex + 1));
  }
  initTwitchCarousel();
})();
