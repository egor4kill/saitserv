/* ============================================================
   УЕБИЩЬ — логика страницы "Скачать сборку"
   Рендерит ссылку на сборку и шаги установки из /config/download.json
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);

  function stepHTML(step, i) {
    return `
      <div class="join__step reveal-auto">
        <span class="join__step-n">${i + 1}</span>
        <p><strong>${step.title}.</strong> ${step.text}</p>
      </div>`;
  }

  async function init() {
    const btn = $("#downloadBtn");
    const meta = $("#downloadMeta");
    const stepsWrap = $("#downloadSteps");
    if (!btn && !stepsWrap) return;
    try {
      const res = await fetch("config/download.json");
      const data = await res.json();

      if (meta) meta.textContent = `${data.version} · ${data.modloader}`;

      if (btn) {
        const url = data.downloadUrl || "";
        const isPlaceholder = /^ЗАМЕНИ_/.test(url);
        btn.href = isPlaceholder ? "#" : url;
        btn.classList.toggle("is-placeholder", isPlaceholder);
        btn.title = isPlaceholder ? "Заглушка — впиши реальную ссылку в config/download.json" : "";
      }

      const steps = data.steps || [];
      if (stepsWrap) stepsWrap.innerHTML = steps.map(stepHTML).join("");

      document.dispatchEvent(new CustomEvent("content:rendered"));
    } catch (err) {
      console.error("Не удалось загрузить download.json", err);
      if (stepsWrap) stepsWrap.innerHTML = `<p class="section-head__desc">Не удалось загрузить инструкцию.</p>`;
    }
  }

  document.addEventListener("partials:ready", init);
})();
