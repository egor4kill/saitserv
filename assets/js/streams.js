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

  const PARENT = location.hostname || "localhost";

  function cardHTML(s) {
    const channel = encodeURIComponent(s.twitchChannel || "");
    const name = escapeHtml(s.name || "");
    const note = escapeHtml(s.note || "");
    const vod = s.vod ? encodeURI(s.vod) : "";

    return `
      <article class="stream-card reveal-auto">
        <div class="stream-card__player">
          <iframe
            src="https://player.twitch.tv/?channel=${channel}&parent=${PARENT}&autoplay=false"
            allowfullscreen
            loading="lazy">
          </iframe>
        </div>
        <div class="stream-card__meta">
          <div>
            <span class="stream-card__name">${name}</span>
            ${note ? `<span class="stream-card__note">${note}</span>` : ""}
          </div>
          <div class="stream-card__links">
            <a href="https://twitch.tv/${channel}" target="_blank" rel="noopener noreferrer" class="link-arrow">канал →</a>
            ${vod ? `<a href="${vod}" target="_blank" rel="noopener noreferrer" class="link-arrow">запись →</a>` : ""}
          </div>
        </div>
      </article>`;
  }

  async function init() {
    const wrap = $("#streamGrid");
    if (!wrap) return;
    try {
      const res = await fetch("config/streams.json");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const streamers = data.streamers || [];
      wrap.innerHTML = streamers.length
        ? streamers.map(cardHTML).join("")
        : `<div class="wiki-empty-hint">Пока никто не добавлен. Открой config/streams.json.</div>`;
      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить streams.json", err);
      wrap.innerHTML = `<div class="wiki-empty-hint">Не удалось загрузить список стримеров.</div>`;
    }
  }

  document.addEventListener("partials:ready", init);
})();
