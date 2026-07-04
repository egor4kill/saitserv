/* ============================================================
   УЕБИЩЬ — общий клиентский код для всех страниц
   - подгрузка partial-ов nav/footer
   - кастомный курсор
   - прогресс-бар прокрутки + reveal-анимации
   - glitch-заголовки по наведению
   - мобильное меню
   - копирование IP (data-copy)
   - пасхалка в футере
   Специфичная для конкретной страницы логика (карта, онлайн-виджет,
   загрузка news.json и т.д.) живёт в отдельных файлах и стартует
   по событию "partials:ready".
   ============================================================ */
(() => {
  "use strict";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ----------------------------------------------------------
     0. ПОДГРУЗКА PARTIAL-ОВ (nav/footer)
     ---------------------------------------------------------- */
  async function loadPartial(hostSelector, url) {
    const host = $(hostSelector);
    if (!host) return;
    try {
      const res = await fetch(url);
      host.outerHTML = await res.text();
    } catch (err) {
      console.error("Не удалось подгрузить", url, err);
    }
  }

  Promise.all([
    loadPartial("#site-header", "partials/nav.html"),
    loadPartial("#site-footer", "partials/footer.html"),
  ]).then(() => {
    markActiveNav();
    initNavAndCursorDependentUI();
    hydrateSocials();
    document.dispatchEvent(new CustomEvent("partials:ready"));
  });

  async function hydrateSocials() {
    try {
      const res = await fetch("config/site.json");
      const site = await res.json();
      $$("[data-social]").forEach((a) => {
        const url = site.socials?.[a.dataset.social];
        if (!url) return;
        a.href = url;
        const isPlaceholder = /^ЗАМЕНИ_/.test(url);
        a.classList.toggle("is-placeholder", isPlaceholder);
        if (isPlaceholder) a.title = "Заглушка — впиши реальную ссылку в config/site.json";
      });
    } catch (err) {
      console.error("Не удалось подгрузить соцсети из site.json", err);
    }
  }

  function markActiveNav() {
    const page = document.body.dataset.page;
    if (!page) return;
    $$(`[data-nav]`).forEach((a) => {
      if (a.dataset.nav === page) a.classList.add("is-active");
    });
  }

  /* ----------------------------------------------------------
     Всё, что трогает элементы из partial-ов (nav, footer),
     инициализируем ПОСЛЕ их подгрузки.
     ---------------------------------------------------------- */
  function initNavAndCursorDependentUI() {
    /* --- мобильное меню --- */
    const burger = $("#navBurger");
    const mobile = $("#navMobile");
    if (burger && mobile) {
      burger.addEventListener("click", () => {
        const open = mobile.hasAttribute("hidden");
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        mobile.toggleAttribute("hidden", !open);
      });
      $$("a", mobile).forEach((a) => a.addEventListener("click", () => {
        mobile.setAttribute("hidden", "");
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }));
    }

    /* --- прогресс-бар + nav is-scrolled --- */
    const progress = $("#scrollProgress");
    const nav = $("#nav");
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      if (progress) progress.style.width = (scrolled * 100) + "%";
      if (nav) nav.classList.toggle("is-scrolled", h.scrollTop > 40);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* --- копирование IP / data-copy кнопки --- */
    $$("[data-copy]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const text = el.getAttribute("data-copy");
        const isIpBtn = el.classList.contains("join__ip-copy");
        const toast = $("#ipToast");
        copyIP(text, isIpBtn ? el : null, toast);
        const heroHint = $(".btn__hint", el);
        const prevHint = heroHint ? heroHint.textContent : null;
        if (heroHint) {
          heroHint.textContent = "скопировано ✓";
          setTimeout(() => { heroHint.textContent = prevHint; }, 1800);
        }
      });
    });

    /* --- пасхалка в футере --- */
    const easter = $("#footerEaster");
    if (easter) {
      let clicks = 0;
      easter.addEventListener("click", () => {
        clicks++;
        easter.textContent = "seed: ─ ─ ─ ты не должен был это видеть";
        easter.style.color = "var(--blood-glow)";
        document.body.style.animation = "grain 0.15s steps(2) 6";
        setTimeout(() => { easter.style.color = ""; }, 1500);
        if (clicks >= 3) easter.textContent = "ладно. seed: -7739521907128401. удачи.";
      });
    }
  }

  function copyIP(text, btn, toast) {
    const done = () => {
      if (btn) { btn.classList.add("copied"); const l = $(".join__ip-copy-label", btn); if (l) l.textContent = "скопировано"; }
      if (toast) { toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 2600); }
      setTimeout(() => { if (btn) { btn.classList.remove("copied"); const l = $(".join__ip-copy-label", btn); if (l) l.textContent = "копировать"; } }, 2600);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} document.body.removeChild(ta); cb();
  }

  /* ----------------------------------------------------------
     1. КАСТОМНЫЙ КУРСОР (не зависит от partial-ов)
     ---------------------------------------------------------- */
  const cursor = $("#cursor");
  if (cursor && matchMedia("(hover: hover)").matches) {
    const ring = $(".cursor-ring", cursor);
    const dot  = $(".cursor-dot", cursor);
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;

    addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      cursor.classList.toggle("is-hover",
        !!e.target.closest("a, button, [data-copy], .feature, .about__card, .player-list li, .season-card, .news-card"));
    });
    addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    addEventListener("pointerup",   () => cursor.classList.remove("is-down"));

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ----------------------------------------------------------
     2. REVEAL-АНИМАЦИИ (работают с любым .reveal на странице)
     ---------------------------------------------------------- */
  function initReveal() {
    const targets = $$(".reveal-auto");
    targets.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    targets.forEach((el) => io.observe(el));
  }
  document.addEventListener("DOMContentLoaded", initReveal);
  document.addEventListener("partials:ready", initReveal);
  document.addEventListener("content:rendered", initReveal);

  /* ----------------------------------------------------------
     3. GLITCH-ЗАГОЛОВКИ ПО НАВЕДЕНИЮ
     ---------------------------------------------------------- */
  function initGlitch() {
    $$(".glitch").forEach((el) => {
      if (el.dataset.glitchBound) return;
      el.dataset.glitchBound = "1";
      const trigger = () => el.classList.add("is-glitching");
      const release = () => el.classList.remove("is-glitching");
      el.addEventListener("mouseenter", trigger);
      el.addEventListener("mouseleave", release);
      el.addEventListener("animationend", release);
    });
    const heroTitle = $(".hero__title .glitch");
    if (heroTitle && !heroTitle.dataset.flickerBound) {
      heroTitle.dataset.flickerBound = "1";
      const flicker = () => {
        heroTitle.classList.add("is-glitching");
        setTimeout(() => heroTitle.classList.remove("is-glitching"), 300);
        setTimeout(flicker, rand(4000, 9000));
      };
      setTimeout(flicker, 3000);
    }
  }
  document.addEventListener("DOMContentLoaded", initGlitch);
  document.addEventListener("partials:ready", initGlitch);
  document.addEventListener("content:rendered", initGlitch);

  /* ----------------------------------------------------------
     4. ПЛАВНЫЙ СКРОЛЛ ПО ЯКОРЯМ
     ---------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + scrollY - 70;
    scrollTo({ top: y, behavior: "smooth" });
  });
})();
