(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function cardHTML(s) {
    const statusLabel = s.status === "active" ? "идёт сейчас" : "архив";
    return `
      <a class="season-card ${s.status === "active" ? "is-active" : ""} reveal-auto" href="${encodeURI(s.link)}">
        <div class="season-card__roman">${escapeHtml(s.roman)}</div>
        <div class="season-card__body">
          <span class="season-card__status">${statusLabel} · ${escapeHtml(s.period)}</span>
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.summary)}</p>
        </div>
        <span class="season-card__arrow">→</span>
      </a>`;
  }

  async function init() {
    try {
      const res = await fetch("config/seasons.json");
      if (!res.ok) throw new Error(`${res.status}`);
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
