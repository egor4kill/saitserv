(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);

  function avatarHTML(p) {
    if (p.avatar) {
      return `<img src="${p.avatar}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='${p.emoji || "👤"}'">`;
    }
    return p.emoji || "👤";
  }

  function cardHTML(p) {
    return `
      <article class="player-card reveal-auto">
        <div class="player-card__top">
          <div class="player-card__emoji">${avatarHTML(p)}</div>
          <div>
            <div class="player-card__name">${p.name}</div>
            <div class="player-card__nick">@${p.nickname}</div>
          </div>
        </div>
        <span class="player-card__role">${p.role}</span><span class="player-card__since">${p.since}</span>
        <p class="player-card__bio">${p.bio}</p>
        ${p.tag ? `<span class="player-card__tag">${p.tag}</span>` : ""}
      </article>`;
  }

  async function init() {
    const wrap = $("#playerGrid");
    if (!wrap) return;
    try {
      const res = await fetch("config/players.json");
      const data = await res.json();
      const players = data.players || [];
      wrap.innerHTML = players.length
        ? players.map(cardHTML).join("")
        : `<div class="wiki-empty-hint">Пока никого не добавили. Открой config/players.json и впиши первых людей.</div>`;
      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить players.json", err);
      wrap.innerHTML = `<div class="wiki-empty-hint">Не удалось загрузить список участников.</div>`;
    }
  }

  document.addEventListener("partials:ready", init);
})();
