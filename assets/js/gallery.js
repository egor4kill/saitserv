(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const BATCH = 12; // сколько фото показываем за раз — экономит трафик тем, кто не долистал

  let allPhotos = [];
  let shown = 0;

  function itemHTML(p, i) {
    return `
      <button class="gallery-item reveal-auto" data-index="${i}" aria-label="Открыть фото: ${p.caption || ""}">
        <img src="${p.thumb}" alt="${p.caption || ""}" loading="lazy" decoding="async" />
        <span class="gallery-item__overlay">
          ${p.season ? `<span class="gallery-item__tag">${p.season}</span>` : ""}
          ${p.caption ? `<span class="gallery-item__caption">${p.caption}</span>` : ""}
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
    const p = allPhotos[index];
    if (!p) return;
    const lb = $("#lightbox");
    const img = $("#lightboxImg", lb);
    const cap = $("#lightboxCaption", lb);
    img.src = p.full || p.thumb; // полный размер грузится только сейчас, по клику
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
  }

  async function init() {
    const wrap = $("#galleryGrid");
    if (!wrap) return;
    try {
      const res = await fetch("config/gallery.json");
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
      lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest("[data-close]")) closeLightbox(); });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

    } catch (err) {
      console.error("Не удалось загрузить gallery.json", err);
      wrap.innerHTML = `<div class="wiki-empty-hint">Не удалось загрузить галерею.</div>`;
    }
  }

  document.addEventListener("partials:ready", init);
})();
