/* ============================================================
   Сервер Уёбищь — логика страницы "Новости" (полный архив)
   Рендерит все записи из /config/news.json в хронологическом
   порядке (новые сверху). Формат карточек — как на главной.
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

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  }

  function newsCardHTML(n) {
    return `
      <article class="news-card reveal-auto">
        <div class="news-card__meta">
          <span class="news-card__tag">${escapeHtml(n.tag)}</span>
          <time>${fmtDate(n.date)}</time>
        </div>
        <h3>${escapeHtml(n.title)}</h3>
        <p>${escapeHtml(n.excerpt)}</p>
      </article>`;
  }

  async function init() {
    const wrap = $("#allNewsList");
    if (!wrap) return;
    try {
      const res = await fetch("config/news.json");
      if (!res.ok) throw new Error(`${res.status}`);
      const news = await res.json();
      const sorted = [...news].sort((a, b) => new Date(b.date) - new Date(a.date));
      wrap.innerHTML = sorted.length
        ? sorted.map(newsCardHTML).join("")
        : `<p class="section-head__desc">Пока новостей нет — загляни позже.</p>`;
      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить news.json", err);
      wrap.innerHTML = `<p class="section-head__desc">Не удалось загрузить новости.</p>`;
    }
  }

  document.addEventListener("partials:ready", init);
})();
