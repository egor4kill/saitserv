/* ============================================================
   УЕБИЩЬ — логика страницы "О сообществе"
   Рендерит вводный абзац и карточки истории из /config/about.json
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);

  function cardHTML(t, i) {
    const num = String(i + 1).padStart(2, "0");
    return `
      <div class="about__card reveal-auto">
        <div class="about__card-num">${num} · ${t.period}</div>
        <h3>${t.title}</h3>
        <p>${t.text}</p>
      </div>`;
  }

  async function init() {
    const introEl = $("#aboutIntro");
    const wrap = $("#aboutTimeline");
    if (!wrap) return;
    try {
      const res = await fetch("config/about.json");
      const data = await res.json();
      if (introEl && data.intro) introEl.textContent = data.intro;
      const timeline = data.timeline || [];
      wrap.innerHTML = timeline.length
        ? timeline.map(cardHTML).join("")
        : `<p class="section-head__desc">История пока не добавлена.</p>`;
      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить about.json", err);
      wrap.innerHTML = `<p class="section-head__desc">Не удалось загрузить историю сообщества.</p>`;
    }
  }

  document.addEventListener("partials:ready", init);
})();
