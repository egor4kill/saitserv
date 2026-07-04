(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);

  // Twitch требует точный параметр parent = хост страницы, на которой встроен плеер.
  // Считаем его на лету, чтобы не переписывать вручную при смене домена/локальной разработке.
  const PARENT = location.hostname || "localhost";

  function cardHTML(s) {
    return `
      <article class="stream-card reveal-auto">
        <div class="stream-card__player">
          <iframe
            src="https://player.twitch.tv/?channel=${s.twitchChannel}&parent=${PARENT}&autoplay=false"
            allowfullscreen
            loading="lazy">
          </iframe>
        </div>
        <div class="stream-card__meta">
          <div>
            <span class="stream-card__name">${s.name}</span>
            ${s.note ? `<span class="stream-card__note">${s.note}</span>` : ""}
          </div>
          <div class="stream-card__links">
            <a href="https://twitch.tv/${s.twitchChannel}" target="_blank" rel="noopener" class="link-arrow">канал →</a>
            ${s.vod ? `<a href="${s.vod}" target="_blank" rel="noopener" class="link-arrow">запись →</a>` : ""}
          </div>
        </div>
      </article>`;
  }

  async function init() {
    const wrap = $("#streamGrid");
    if (!wrap) return;
    try {
      const res = await fetch("config/streams.json");
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
