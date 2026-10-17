/* ============================================================
   УЕБИЩЬ — логика страницы "Правила"
   Рендерит категории правил из /config/rules.json.
   ============================================================ */
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

  function categoryHTML(cat, i) {
    const num = String(i + 1).padStart(2, "0");
    const items = (cat.items || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
    return `
      <div class="rules-category reveal-auto">
        <span class="rules-category__num">${num}</span>
        <h3 class="rules-category__title">${escapeHtml(cat.title)}</h3>
        <ul class="rules-category__list">${items}</ul>
      </div>`;
  }

  async function init() {
    const wrap = $("#rulesList");
    if (!wrap) return;
    try {
      const res = await fetch("config/rules.json");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const categories = data.categories || [];
      wrap.innerHTML = categories.length
        ? categories.map(categoryHTML).join("")
        : `<p class="section-head__desc">Правила пока не добавлены.</p>`;
      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить rules.json", err);
      wrap.innerHTML = `<p class="section-head__desc">Не удалось загрузить правила.</p>`;
    }
  }

  document.addEventListener("partials:ready", init);
})();
