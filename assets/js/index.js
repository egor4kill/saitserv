/* ============================================================
   УЕБИЩЬ — логика главной страницы (хаб сообщества)
   Рендерит hero-статистику, тизер сезона, карточки новостей
   из /config/*.json. Как только контент вставлен — стреляет
   "content:rendered", чтобы site.js навесил reveal/glitch.
   ============================================================ */
(() => {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  }

  async function renderHero(site) {
    $("#heroTagline") && ($("#heroTagline").textContent = site.tagline);
    $("#heroDesc") && ($("#heroDesc").textContent = site.description);
    $("#statSeasons") && ($("#statSeasons").textContent = site.stats.seasons);
    $("#statDays") && ($("#statDays").textContent = site.stats.daysAlive);
    $("#statSince") && ($("#statSince").textContent = site.stats.since);
    $("#ipText") && ($("#ipText").textContent = site.ip);
    const ipBtn = $("#ipCopy");
    if (ipBtn) ipBtn.setAttribute("data-copy", site.ip);
    const heroPlay = $("#heroPlayBtn");
    if (heroPlay) heroPlay.setAttribute("data-copy", site.ip);

    // симулируем текущий онлайн (реальные данные — когда будет query к серверу)
    const online = randInt(2, site.stats.peakOnline || 12);
    $("#navStatusText") && ($("#navStatusText").textContent = `Онлайн · ${online}`);
    $("#heroOnline") && ($("#heroOnline").textContent = online);
  }

  function seasonCardHTML(s) {
    const statusLabel = s.status === "active" ? "идёт сейчас" : "архив";
    return `
      <a class="season-card ${s.status === "active" ? "is-active" : ""} reveal-auto" href="${s.link}">
        <div class="season-card__roman">${s.roman}</div>
        <div class="season-card__body">
          <span class="season-card__status">${statusLabel} · ${s.period}</span>
          <h3>${s.title}</h3>
          <p>${s.summary}</p>
        </div>
        <span class="season-card__arrow">→</span>
      </a>`;
  }

  function newsCardHTML(n) {
    return `
      <article class="news-card reveal-auto">
        <div class="news-card__meta">
          <span class="news-card__tag">${n.tag}</span>
          <time>${fmtDate(n.date)}</time>
        </div>
        <h3>${n.title}</h3>
        <p>${n.excerpt}</p>
      </article>`;
  }

  async function init() {
    try {
      const [site, seasons, news] = await Promise.all([
        getJSON("config/site.json"),
        getJSON("config/seasons.json"),
        getJSON("config/news.json"),
      ]);

      await renderHero(site);

      const seasonWrap = $("#seasonList");
      if (seasonWrap) seasonWrap.innerHTML = seasons.map(seasonCardHTML).join("");

      const newsWrap = $("#newsList");
      if (newsWrap) newsWrap.innerHTML = news.slice(0, 3).map(newsCardHTML).join("");

      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить конфиги", err);
    }
  }

  document.addEventListener("partials:ready", init);
})();
