const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  revealItems.forEach((item) => item.classList.add("reveal-pending"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending");
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.querySelectorAll(".faq-item button").forEach((button) => {
  const item = button.closest(".faq-item");
  const answer = item?.querySelector(".faq-answer");
  if (answer) {
    const answerId = answer.id || `faq-answer-${Math.random().toString(36).slice(2, 9)}`;
    answer.id = answerId;
    answer.setAttribute("role", "region");
    answer.setAttribute("aria-hidden", String(button.getAttribute("aria-expanded") !== "true"));
    button.setAttribute("aria-controls", answerId);
  }

  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const group = item?.parentElement;
    group?.querySelectorAll(".faq-item").forEach((other) => {
      if (other !== item) {
        other.classList.remove("is-open");
        other.querySelector("button")?.setAttribute("aria-expanded", "false");
        other.querySelector(".faq-answer")?.setAttribute("aria-hidden", "true");
      }
    });
    const open = item?.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(Boolean(open)));
    item?.querySelector(".faq-answer")?.setAttribute("aria-hidden", String(!open));
  });
});

const menuButton = document.querySelector("[data-menu-toggle]");
const primaryMenu = document.querySelector("[data-menu]");

if (menuButton && primaryMenu) {
  const closeMenu = () => {
    primaryMenu.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    const label = menuButton.querySelector(".sr-only");
    if (label) {
      label.textContent = document.documentElement.lang.startsWith("fa")
        ? "باز کردن منو"
        : "Open menu";
    }
  };

  menuButton.addEventListener("click", () => {
    const isOpen = primaryMenu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    const label = menuButton.querySelector(".sr-only");
    if (label) {
      const isPersian = document.documentElement.lang.startsWith("fa");
      label.textContent = isOpen
        ? (isPersian ? "بستن منو" : "Close menu")
        : (isPersian ? "باز کردن منو" : "Open menu");
    }
    if (isOpen) primaryMenu.querySelector("a")?.focus();
  });

  primaryMenu.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", closeMenu),
  );

  document.addEventListener("click", (event) => {
    if (!primaryMenu.contains(event.target) && !menuButton.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && primaryMenu.classList.contains("is-open")) {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) closeMenu();
  });
}

document.querySelectorAll("[data-year]").forEach((target) => {
  const locale = document.documentElement.lang.startsWith("fa") ? "fa-IR" : "en";
  target.textContent = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    calendar: "gregory",
  }).format(new Date());
});

// Add the language switch to bilingual Persian inner pages. Article pages stay Persian-only.
if (
  document.documentElement.lang.startsWith("fa") &&
  !document.querySelector(".header-languages") &&
  !window.location.pathname.includes("article-template")
) {
  const actions = document.querySelector(".header-actions");
  if (actions) {
    const languages = document.createElement("div");
    languages.className = "header-languages";
    languages.setAttribute("aria-label", "انتخاب زبان");
    languages.innerHTML =
      '<a class="active" href="index.html" lang="fa" aria-current="page">FA</a><a href="en.html" lang="en">EN</a>';
    actions.prepend(languages);
  }
}

document.querySelectorAll("[data-logo-slider]").forEach((slider) => {
  const viewport = slider.querySelector("[data-logo-viewport]");
  const track = slider.querySelector("[data-logo-track]");
  const slides = [...slider.querySelectorAll(".brand-logo-slide")];
  const previousButton = slider.querySelector("[data-logo-prev]");
  const nextButton = slider.querySelector("[data-logo-next]");
  const toggleButton = slider.querySelector("[data-logo-toggle]");
  const status = slider.querySelector("[data-logo-status]");
  if (!viewport || !track || slides.length < 2) return;

  const isPersian = document.documentElement.lang.startsWith("fa");
  const isRtl = document.documentElement.dir === "rtl";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const numberFormat = new Intl.NumberFormat(isPersian ? "fa-IR" : "en");
  let index = 0;
  let timer = null;
  let pointerStart = null;
  let pointerId = null;
  let hoverPaused = false;
  let focusPaused = false;
  let interactionPaused = false;
  let isVisible = true;
  let userPaused = reducedMotion.matches;
  let resizeFrame = null;
  let liveTimer = null;

  const visibleCount = () =>
    Math.max(1, Number.parseInt(getComputedStyle(slider).getPropertyValue("--logo-visible"), 10) || 6);
  const maxIndex = () => Math.max(0, slides.length - visibleCount());

  const announceStatus = () => {
    if (!status) return;
    status.setAttribute("aria-live", "polite");
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => status.setAttribute("aria-live", "off"), 700);
  };

  const render = ({ announce = false, animate = true } = {}) => {
    index = Math.min(Math.max(index, 0), maxIndex());
    const distance = slides[index].offsetLeft - slides[0].offsetLeft;
    if (!animate) track.style.transition = "none";
    track.style.transform = `translate3d(${-distance}px, 0, 0)`;
    if (!animate) {
      track.getBoundingClientRect();
      track.style.removeProperty("transition");
    }
    if (status) {
      const current = numberFormat.format(index + 1);
      const total = numberFormat.format(slides.length);
      status.textContent = isPersian ? `${current} از ${total}` : `${current} of ${total}`;
      if (announce) announceStatus();
    }
  };

  const updateToggle = () => {
    if (!toggleButton) return;
    const icon = toggleButton.querySelector('[aria-hidden="true"]');
    const text = toggleButton.querySelector(".sr-only");
    const pausedLabel = isPersian ? "شروع حرکت خودکار" : "Start automatic rotation";
    const playingLabel = isPersian ? "توقف حرکت خودکار" : "Pause automatic rotation";
    toggleButton.classList.toggle("is-paused", userPaused);
    toggleButton.setAttribute("aria-pressed", String(userPaused));
    toggleButton.setAttribute("aria-label", userPaused ? pausedLabel : playingLabel);
    if (icon) icon.textContent = userPaused ? "▶" : "Ⅱ";
    if (text) text.textContent = userPaused ? pausedLabel : playingLabel;
  };

  const shouldPause = () =>
    userPaused || hoverPaused || focusPaused || interactionPaused || !isVisible || document.hidden || maxIndex() === 0;

  const stop = () => {
    window.clearInterval(timer);
    timer = null;
  };

  const start = () => {
    stop();
    if (shouldPause()) return;
    timer = window.setInterval(() => {
      index = index >= maxIndex() ? 0 : index + 1;
      render();
    }, 3200);
  };

  const move = (direction, announce = true) => {
    const limit = maxIndex();
    if (direction > 0) index = index >= limit ? 0 : index + 1;
    else index = index <= 0 ? limit : index - 1;
    render({ announce });
    start();
  };

  previousButton?.addEventListener("click", () => move(-1));
  nextButton?.addEventListener("click", () => move(1));
  toggleButton?.addEventListener("click", () => {
    userPaused = !userPaused;
    updateToggle();
    start();
  });

  slider.addEventListener("mouseenter", () => {
    hoverPaused = true;
    stop();
  });
  slider.addEventListener("mouseleave", () => {
    hoverPaused = false;
    start();
  });
  slider.addEventListener("focusin", () => {
    focusPaused = true;
    stop();
  });
  slider.addEventListener("focusout", (event) => {
    if (slider.contains(event.relatedTarget)) return;
    focusPaused = false;
    start();
  });

  viewport.addEventListener("keydown", (event) => {
    const nextKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const previousKey = isRtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === nextKey) {
      event.preventDefault();
      move(1);
    } else if (event.key === previousKey) {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      index = 0;
      render({ announce: true });
    } else if (event.key === "End") {
      event.preventDefault();
      index = maxIndex();
      render({ announce: true });
    }
  });

  viewport.addEventListener("pointerdown", (event) => {
    pointerStart = event.clientX;
    pointerId = event.pointerId;
    interactionPaused = true;
    stop();
    viewport.setPointerCapture?.(event.pointerId);
  });
  const finishPointer = (event) => {
    if (pointerStart === null || (pointerId !== null && event.pointerId !== pointerId)) return;
    const distance = event.clientX - pointerStart;
    pointerStart = null;
    pointerId = null;
    interactionPaused = false;
    if (Math.abs(distance) >= 42) move(distance < 0 ? 1 : -1);
    else start();
  };
  viewport.addEventListener("pointerup", finishPointer);
  viewport.addEventListener("pointercancel", finishPointer);

  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      index = Math.min(index, maxIndex());
      render({ animate: false });
      start();
    });
  });
  document.addEventListener("visibilitychange", start);

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      start();
    }, { threshold: 0.1 });
    visibilityObserver.observe(slider);
  }

  reducedMotion.addEventListener?.("change", (event) => {
    if (event.matches) userPaused = true;
    updateToggle();
    start();
  });

  render({ animate: false });
  updateToggle();
  start();
});
