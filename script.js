const root = document.documentElement;
const hero = document.querySelector(".hero");
const revealItems = document.querySelectorAll(".reveal");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateLens() {
  if (!hero) return;

  const rect = hero.getBoundingClientRect();
  const scrollable = Math.max(hero.offsetHeight - window.innerHeight, 1);
  const progress = clamp(Math.abs(rect.top) / scrollable, 0, 1);
  const eased = Math.pow(progress, 1.75);

  root.style.setProperty("--lens-open", eased.toFixed(4));
  root.style.setProperty("--hero-dim", (0.72 - eased * 0.34).toFixed(4));
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.18 }
);

for (const item of revealItems) {
  revealObserver.observe(item);
}

let ticking = false;

function requestLensUpdate() {
  if (ticking) return;

  ticking = true;
  requestAnimationFrame(() => {
    updateLens();
    ticking = false;
  });
}

window.addEventListener("scroll", requestLensUpdate, { passive: true });
window.addEventListener("resize", requestLensUpdate);

updateLens();
