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

const handlePageReady = () => {
  document.documentElement.style.scrollBehavior = "smooth";
  hideLoader();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", handlePageReady);
} else {
  handlePageReady();
}

document.addEventListener("astro:before-preparation", () => {
  document.documentElement.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  showLoader();
});

document.addEventListener("astro:page-load", () => {
  handlePageReady();
});
