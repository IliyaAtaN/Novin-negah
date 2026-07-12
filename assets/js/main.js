const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
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
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const group = item?.parentElement;
    group?.querySelectorAll(".faq-item").forEach((other) => {
      if (other !== item) {
        other.classList.remove("is-open");
        other.querySelector("button")?.setAttribute("aria-expanded", "false");
      }
    });
    const open = item?.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(Boolean(open)));
  });
});

const menuButton = document.querySelector("[data-menu-toggle]");
const primaryMenu = document.querySelector("[data-menu]");

if (menuButton && primaryMenu) {
  const closeMenu = () => {
    primaryMenu.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = primaryMenu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
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
    if (event.key === "Escape") closeMenu();
  });
}

document.querySelectorAll("[data-year]").forEach((target) => {
  const locale = document.documentElement.lang.startsWith("fa") ? "fa-IR" : "en";
  target.textContent = new Intl.DateTimeFormat(locale, { year: "numeric" }).format(new Date());
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
