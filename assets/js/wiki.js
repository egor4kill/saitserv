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

  function cardElement(p) {
    const card = document.createElement("article");
    card.className = "player-card reveal-auto";

    const top = document.createElement("div");
    top.className = "player-card__top";

    const emojiWrap = document.createElement("div");
    emojiWrap.className = "player-card__emoji";

    if (p.avatar) {
      const img = document.createElement("img");
      img.src = encodeURI(p.avatar);
      img.alt = p.name || "";
      img.loading = "lazy";
      img.onerror = () => {
        emojiWrap.textContent = p.emoji || "👤";
      };
      emojiWrap.appendChild(img);
    } else {
      emojiWrap.textContent = p.emoji || "👤";
    }

    const nameBlock = document.createElement("div");
    nameBlock.innerHTML = `
      <div class="player-card__name">${escapeHtml(p.name)}</div>
      <div class="player-card__nick">@${escapeHtml(p.nickname)}</div>
    `;

    top.appendChild(emojiWrap);
    top.appendChild(nameBlock);
    card.appendChild(top);

    const role = document.createElement("span");
    role.className = "player-card__role";
    role.textContent = p.role || "";
    card.appendChild(role);

    const since = document.createElement("span");
    since.className = "player-card__since";
    since.textContent = p.since || "";
    card.appendChild(since);

    const bio = document.createElement("p");
    bio.className = "player-card__bio";
    bio.textContent = p.bio || "";
    card.appendChild(bio);

    if (p.tag) {
      const tag = document.createElement("span");
      tag.className = "player-card__tag";
      tag.textContent = p.tag;
      card.appendChild(tag);
    }

    return card;
  }

  async function init() {
    const wrap = $("#playerGrid");
    if (!wrap) return;
    try {
      const res = await fetch("config/players.json");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const players = data.players || [];
      wrap.innerHTML = "";
      if (players.length) {
        players.forEach((p) => wrap.appendChild(cardElement(p)));
      } else {
        wrap.innerHTML = `<div class="wiki-empty-hint">Пока никого не добавили. Открой config/players.json и впиши первых людей.</div>`;
      }
      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить players.json", err);
      wrap.innerHTML = `<div class="wiki-empty-hint">Не удалось загрузить список участников.</div>`;
    }
  }

  function loreCardHTML(e) {
    return `
      <div class="about__card reveal-auto">
        <div class="about__card-num">${escapeHtml(e.type)}</div>
        <h3>${escapeHtml(e.title)}</h3>
        <p>${escapeHtml(e.text)}</p>
      </div>`;
  }

  async function initLore() {
    const wrap = $("#loreGrid");
    if (!wrap) return;
    try {
      const res = await fetch("config/lore.json");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const entries = data.entries || [];
      wrap.innerHTML = entries.length
        ? entries.map(loreCardHTML).join("")
        : `<div class="wiki-empty-hint">Пока ничего не добавлено. Открой config/lore.json.</div>`;
      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить lore.json", err);
      wrap.innerHTML = `<div class="wiki-empty-hint">Не удалось загрузить лор.</div>`;
    }
  }

  document.addEventListener("partials:ready", init);
  document.addEventListener("partials:ready", initLore);
})();
