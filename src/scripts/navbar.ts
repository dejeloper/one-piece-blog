function initMenu() {
  const btn = document.getElementById("menu-btn");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("overlay");

  if (!btn || !menu || !overlay) return;

  const toggleMenu = () => {
    const isMenuOpen = !menu.classList.contains("translate-x-full");

    if (isMenuOpen) {
      menu.classList.add("translate-x-full");
      overlay.classList.remove("opacity-100");
      overlay.classList.add("opacity-0");

      setTimeout(() => {
        menu.classList.add("hidden");
        overlay.classList.add("hidden");
      }, 400);
    } else {
      menu.classList.remove("hidden");
      overlay.classList.remove("hidden");

      requestAnimationFrame(() => {
        menu.classList.remove("translate-x-full");
        overlay.classList.remove("opacity-0");
        overlay.classList.add("opacity-100");
      });
    }
  };

  btn.addEventListener("click", toggleMenu);
  overlay.addEventListener("click", toggleMenu);

  // Close menu on link click
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", toggleMenu);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMenu);
} else {
  initMenu();
}

document.addEventListener("astro:page-load", initMenu);
