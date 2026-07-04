(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);

  function cardHTML(s) {
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

  async function init() {
    try {
      const res = await fetch("config/seasons.json");
      const seasons = await res.json();
      const wrap = $("#allSeasonsList");
      if (wrap) wrap.innerHTML = seasons.map(cardHTML).join("");
      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить seasons.json", err);
    }
  }

  document.addEventListener("partials:ready", init);
})();
