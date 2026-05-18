const root = document.documentElement;
const hero = document.querySelector(".hero");
const revealItems = document.querySelectorAll(".reveal");
const lensHoldDistance = 620;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function updateLens() {
  if (!hero) return;

  const rect = hero.getBoundingClientRect();
  const scrollable = Math.max(hero.offsetHeight - window.innerHeight, 1);
  const lensDistance = Math.max(scrollable - lensHoldDistance, 1);
  const progress = clamp(Math.abs(rect.top) / lensDistance, 0, 1);
  const eased = Math.pow(clamp(progress / 0.78, 0, 1), 1.55);
  const personEnter = clamp((progress - 0.04) / 0.96, 0, 1);
  const personEased = easeInOutCubic(personEnter);
  const eyebrowEnter = easeInOutCubic(clamp((progress - 0.0) / 0.82, 0, 1));
  const nameEmreEnter = easeInOutCubic(clamp((progress - 0.03) / 0.86, 0, 1));
  const nameSurnameEnter = easeInOutCubic(clamp((progress - 0.12) / 0.86, 0, 1));
  const stripeEnter = easeInOutCubic(clamp((progress - 0.15) / 0.82, 0, 1));
  const linksEnter = easeInOutCubic(clamp((progress - 0.2) / 0.78, 0, 1));
  const heroStageVisible = clamp((1 - progress) / 0.12, 0, 1);

  root.style.setProperty("--lens-open", eased.toFixed(4));
  root.style.setProperty("--person-enter", personEased.toFixed(4));
  root.style.setProperty("--eyebrow-enter", eyebrowEnter.toFixed(4));
  root.style.setProperty("--name-emre-enter", nameEmreEnter.toFixed(4));
  root.style.setProperty("--name-surname-enter", nameSurnameEnter.toFixed(4));
  root.style.setProperty("--stripe-enter", stripeEnter.toFixed(4));
  root.style.setProperty("--links-enter", linksEnter.toFixed(4));
  root.style.setProperty("--hero-stage-visible", heroStageVisible);
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
