if (typeof document !== "undefined") {
  const hideLoader = () => {
    const loader = document.getElementById("transition-loader");
    if (!loader) return;
    loader.style.opacity = "0";
    loader.style.pointerEvents = "none";
  };

  const showLoader = () => {
    const loader = document.getElementById("transition-loader");
    if (!loader) return;
    loader.style.opacity = "1";
    loader.style.pointerEvents = "auto";
  };

  hideLoader();

  document.addEventListener("astro:before-preparation", () => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    showLoader();
  });

  document.addEventListener("astro:page-load", () => {
    document.documentElement.style.scrollBehavior = "smooth";
    hideLoader();
  });
}
