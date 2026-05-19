const root = document.documentElement;
const hero = document.querySelector(".hero");
const aboutSection = document.querySelector("#about");
const revealItems = document.querySelectorAll(".reveal");
const lensHoldDistance = 620;
const exitDelay = 0.1;
const sceneEnd = 1 + exitDelay;
const aboutTransitionProgress = 0.82 + exitDelay + 0.09;
let aboutTransitionStarted = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeInCubic(value) {
  return value * value * value;
}

function updateLens() {
  if (!hero) return;

  const rect = hero.getBoundingClientRect();
  const scrollable = Math.max(hero.offsetHeight - window.innerHeight, 1);
  const lensDistance = Math.max(scrollable - lensHoldDistance, 1);
  const scrolled = Math.abs(rect.top);
  const progress = clamp(scrolled / lensDistance, 0, sceneEnd);
  const eased = Math.pow(clamp(progress / 0.78, 0, 1), 1.55);
  const personExit = 1 - easeInCubic(clamp((progress - (0.82 + exitDelay)) / 0.18, 0, 1));
  const eyebrowExit = 1 - easeInCubic(clamp((progress - (0.78 + exitDelay)) / 0.2, 0, 1));
  const nameEmreExit = 1 - easeInCubic(clamp((progress - (0.8 + exitDelay)) / 0.19, 0, 1));
  const nameSurnameExit = 1 - easeInCubic(clamp((progress - (0.82 + exitDelay)) / 0.18, 0, 1));
  const stripeExit = 1 - easeInCubic(clamp((progress - (0.84 + exitDelay)) / 0.16, 0, 1));
  const linksExit = 1 - easeInCubic(clamp((progress - (0.86 + exitDelay)) / 0.14, 0, 1));
  const quoteOneExit = 1 - easeInCubic(clamp((progress - (0.78 + exitDelay)) / 0.18, 0, 1));
  const quoteTwoExit = 1 - easeInCubic(clamp((progress - (0.82 + exitDelay)) / 0.16, 0, 1));
  const personEnter = easeInOutCubic(clamp((progress - 0.04) / 0.58, 0, 1));
  const eyebrowIn = easeInOutCubic(clamp((progress - 0.0) / 0.5, 0, 1));
  const nameEmreIn = easeInOutCubic(clamp((progress - 0.03) / 0.52, 0, 1));
  const nameSurnameIn = easeInOutCubic(clamp((progress - 0.12) / 0.52, 0, 1));
  const stripeIn = easeInOutCubic(clamp((progress - 0.15) / 0.5, 0, 1));
  const linksIn = easeInOutCubic(clamp((progress - 0.2) / 0.48, 0, 1));
  const quoteOneIn = easeInOutCubic(clamp((progress - 0.18) / 0.46, 0, 1));
  const quoteTwoIn = easeInOutCubic(clamp((progress - 0.24) / 0.46, 0, 1));

  const personEased = personEnter * personExit;
  const eyebrowEnter = eyebrowIn * eyebrowExit;
  const nameEmreEnter = nameEmreIn * nameEmreExit;
  const nameSurnameEnter = nameSurnameIn * nameSurnameExit;
  const stripeEnter = stripeIn * stripeExit;
  const linksEnter = linksIn * linksExit;
  const quoteOneEnter = quoteOneIn * quoteOneExit;
  const quoteTwoEnter = quoteTwoIn * quoteTwoExit;
  const heroStageVisible = progress < sceneEnd ? 1 : 0;

  root.style.setProperty("--lens-open", eased.toFixed(4));
  root.style.setProperty("--person-enter", personEased.toFixed(4));
  root.style.setProperty("--eyebrow-enter", eyebrowEnter.toFixed(4));
  root.style.setProperty("--name-emre-enter", nameEmreEnter.toFixed(4));
  root.style.setProperty("--name-surname-enter", nameSurnameEnter.toFixed(4));
  root.style.setProperty("--stripe-enter", stripeEnter.toFixed(4));
  root.style.setProperty("--links-enter", linksEnter.toFixed(4));
  root.style.setProperty("--quote-one-enter", quoteOneEnter.toFixed(4));
  root.style.setProperty("--quote-two-enter", quoteTwoEnter.toFixed(4));
  root.style.setProperty("--hero-stage-visible", heroStageVisible);

  if (progress < 0.82) {
    aboutTransitionStarted = false;
  }

  if (!aboutTransitionStarted && progress >= aboutTransitionProgress && aboutSection) {
    aboutTransitionStarted = true;
    aboutSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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
