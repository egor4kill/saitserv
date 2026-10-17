(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const BATCH = 12;

  let allPhotos = [];
  let shown = 0;
  let currentLbIndex = -1;

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function itemHTML(p, i) {
    const caption = escapeHtml(p.caption || "");
    const season = escapeHtml(p.season || "");
    const thumb = encodeURI(p.thumb || "");
    return `
      <button class="gallery-item reveal-auto" data-index="${i}" aria-label="Открыть фото: ${caption}">
        <img src="${thumb}" alt="${caption}" loading="lazy" decoding="async" />
        <span class="gallery-item__overlay">
          ${season ? `<span class="gallery-item__tag">${season}</span>` : ""}
          ${caption ? `<span class="gallery-item__caption">${caption}</span>` : ""}
        </span>
      </button>`;
  }

  function renderBatch() {
    const wrap = $("#galleryGrid");
    const next = allPhotos.slice(shown, shown + BATCH);
    wrap.insertAdjacentHTML("beforeend", next.map((p, idx) => itemHTML(p, shown + idx)).join(""));
    shown += next.length;

    const moreBtn = $("#galleryMore");
    if (moreBtn) moreBtn.hidden = shown >= allPhotos.length;

    document.dispatchEvent(new CustomEvent("content:rendered"));
  }

  function openLightbox(index) {
    if (index < 0 || index >= allPhotos.length) return;
    currentLbIndex = index;
    const p = allPhotos[index];
    if (!p) return;
    const lb = $("#lightbox");
    const img = $("#lightboxImg", lb);
    const cap = $("#lightboxCaption", lb);
    img.src = p.full || p.thumb;
    img.alt = p.caption || "";
    cap.textContent = [p.season, p.caption].filter(Boolean).join(" · ");
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    const lb = $("#lightbox");
    lb.hidden = true;
    $("#lightboxImg", lb).src = "";
    document.body.style.overflow = "";
    currentLbIndex = -1;
  }

  function showNextLightbox() {
    if (currentLbIndex === -1 || !allPhotos.length) return;
    openLightbox((currentLbIndex + 1) % allPhotos.length);
  }

  function showPrevLightbox() {
    if (currentLbIndex === -1 || !allPhotos.length) return;
    openLightbox((currentLbIndex - 1 + allPhotos.length) % allPhotos.length);
  }

  async function init() {
    const wrap = $("#galleryGrid");
    if (!wrap) return;
    try {
      const res = await fetch("config/gallery.json");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      allPhotos = data.photos || [];

      if (!allPhotos.length) {
        wrap.innerHTML = `<div class="wiki-empty-hint">Фото пока нет. Открой config/gallery.json и добавь первые.</div>`;
        return;
      }

      renderBatch();

      wrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".gallery-item");
        if (btn) openLightbox(Number(btn.dataset.index));
      });

      const moreBtn = $("#galleryMore");
      if (moreBtn) moreBtn.addEventListener("click", renderBatch);

      const lb = $("#lightbox");
      lb.addEventListener("click", (e) => {
        if (e.target === lb || e.target.closest("[data-close]")) closeLightbox();
      });

      document.addEventListener("keydown", (e) => {
        if (lb.hidden) return;
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowRight") showNextLightbox();
        else if (e.key === "ArrowLeft") showPrevLightbox();
      });

    } catch (err) {
      console.error("Не удалось загрузить gallery.json", err);
      wrap.innerHTML = `<div class="wiki-empty-hint">Не удалось загрузить галерею.</div>`;
    }
  }

  document.addEventListener("partials:ready", init);
})();
