const root = document.documentElement;
const hero = document.querySelector(".hero");
const aboutSection = document.querySelector("#about");
const revealItems = document.querySelectorAll(".reveal");
const backToHero = document.querySelector(".back-to-hero");
const lensHoldDistance = 620;
const exitDelay = 0.1;
const sceneEnd = 1 + exitDelay;
const aboutTransitionProgress = 1.09;
const aboutSnapPoints = [0, 0.49, 0.86];
let aboutTransitionStarted = false;
let returningToHero = false;
let previousHeroProgress = null;
let lastScrollY = window.scrollY;
let transitionScrollLocked = false;
let touchStartY = 0;
let introTransitionFrame = null;
let aboutSnapAnimating = false;
let aboutSnapCooldownUntil = 0;
let lockedAboutSnapIndex = null;

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

function fadeRange(progress, start, end) {
  return easeInOutCubic(clamp((progress - start) / (end - start), 0, 1));
}

function animateScrollTo(targetY, duration = 1700, onComplete, onUpdate) {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startedAt = performance.now();

  function step(now) {
    const elapsed = now - startedAt;
    const progress = clamp(elapsed / duration, 0, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (onUpdate) onUpdate(progress);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else if (onComplete) {
      onComplete();
    }
  }

  requestAnimationFrame(step);
}

function animateIntroTitleTo(value, duration, onComplete) {
  if (introTransitionFrame) {
    cancelAnimationFrame(introTransitionFrame);
  }

  const startValue = Number.parseFloat(
    getComputedStyle(root).getPropertyValue("--about-intro-title")
  ) || 0;
  const distance = value - startValue;
  const startedAt = performance.now();

  function step(now) {
    const elapsed = now - startedAt;
    const progress = clamp(elapsed / duration, 0, 1);
    const eased = easeInOutCubic(progress);
    root.style.setProperty("--about-intro-title", (startValue + distance * eased).toFixed(4));

    if (progress < 1) {
      introTransitionFrame = requestAnimationFrame(step);
    } else {
      introTransitionFrame = null;
      if (onComplete) onComplete();
    }
  }

  introTransitionFrame = requestAnimationFrame(step);
}

function startAboutIntroTransition() {
  if (!aboutSection) return;

  aboutTransitionStarted = true;
  transitionScrollLocked = true;

  animateIntroTitleTo(1, 620, () => {
    setTimeout(() => {
      animateScrollTo(
        aboutSection.getBoundingClientRect().top + window.scrollY,
        1800,
        () => {
          transitionScrollLocked = false;
          root.style.setProperty("--about-intro-title", "0");
        },
        (progress) => {
          const fadeOut = 1 - easeInOutCubic(clamp((progress - 0.12) / 0.76, 0, 1));
          root.style.setProperty("--about-intro-title", fadeOut.toFixed(4));
        }
      );
    }, 260);
  });
}

function steppedAboutTrack(progress) {
  if (progress < 0.03) return 0;
  if (progress < 0.36) return easeInOutCubic((progress - 0.03) / 0.33);
  if (progress < 0.56) return 1;
  if (progress < 0.82) return 1 + easeInOutCubic((progress - 0.56) / 0.26);
  return 2;
}

function updateLens() {
  if (!hero) return;

  const currentScrollY = window.scrollY;
  const isScrollingDown = currentScrollY > lastScrollY;
  const rect = hero.getBoundingClientRect();
  const scrollable = Math.max(hero.offsetHeight - window.innerHeight, 1);
  const lensDistance = Math.max(scrollable - lensHoldDistance, 1);
  const scrolled = Math.abs(rect.top);
  const progress = clamp(scrolled / lensDistance, 0, sceneEnd);
  const eased = Math.pow(clamp(progress / 0.78, 0, 1), 1.55);
  const personExit = 1 - easeInOutCubic(clamp((progress - 0.86) / 0.17, 0, 1));
  const eyebrowExit = 1 - easeInOutCubic(clamp((progress - 0.84) / 0.18, 0, 1));
  const nameEmreExit = 1 - easeInOutCubic(clamp((progress - 0.85) / 0.17, 0, 1));
  const nameSurnameExit = 1 - easeInOutCubic(clamp((progress - 0.86) / 0.17, 0, 1));
  const stripeExit = 1 - easeInOutCubic(clamp((progress - 0.88) / 0.15, 0, 1));
  const linksExit = 1 - easeInOutCubic(clamp((progress - 0.89) / 0.14, 0, 1));
  const quoteOneExit = 1 - easeInOutCubic(clamp((progress - 0.84) / 0.17, 0, 1));
  const quoteTwoExit = 1 - easeInOutCubic(clamp((progress - 0.86) / 0.16, 0, 1));
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

  if (returningToHero && progress < 0.9) {
    returningToHero = false;
  }

  if (progress < 0.82) {
    aboutTransitionStarted = false;
  }

  const crossedIntroThreshold =
    previousHeroProgress !== null &&
    previousHeroProgress < 1 &&
    progress >= 1;

  if (!returningToHero && !aboutTransitionStarted && isScrollingDown && crossedIntroThreshold && aboutSection) {
    startAboutIntroTransition();
  }

  previousHeroProgress = progress;
  lastScrollY = currentScrollY;
}

function getHeroShowcaseScrollY() {
  if (!hero) return 0;

  const heroTop = hero.getBoundingClientRect().top + window.scrollY;
  const scrollable = Math.max(hero.offsetHeight - window.innerHeight, 1);
  const lensDistance = Math.max(scrollable - lensHoldDistance, 1);

  return heroTop + lensDistance * 0.74;
}

function getAboutProgress() {
  if (!aboutSection) return 0;

  const rect = aboutSection.getBoundingClientRect();
  const scrollable = Math.max(aboutSection.offsetHeight - window.innerHeight, 1);
  return clamp(-rect.top / scrollable, 0, 1);
}

function getAboutScrollYForProgress(progress) {
  if (!aboutSection) return window.scrollY;

  const aboutTop = aboutSection.getBoundingClientRect().top + window.scrollY;
  const scrollable = Math.max(aboutSection.offsetHeight - window.innerHeight, 1);
  return aboutTop + scrollable * progress;
}

function getNearestAboutSnapIndex(progress) {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < aboutSnapPoints.length; index += 1) {
    const distance = Math.abs(progress - aboutSnapPoints[index]);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}

function isAboutSnapActive() {
  if (!aboutSection) return false;

  const rect = aboutSection.getBoundingClientRect();
  return rect.top <= 4 && rect.bottom >= window.innerHeight + 4;
}

function handleAboutSnap(direction) {
  if (!isAboutSnapActive()) return false;

  if (aboutSnapAnimating || performance.now() < aboutSnapCooldownUntil) return true;

  const currentProgress = getAboutProgress();
  const currentIndex = getNearestAboutSnapIndex(currentProgress);
  const targetIndex = currentIndex + (direction > 0 ? 1 : -1);

  if (targetIndex < 0 || targetIndex >= aboutSnapPoints.length) {
    return false;
  }

  aboutSnapAnimating = true;
  lockedAboutSnapIndex = targetIndex;
  root.style.setProperty("--about-track-x", `${targetIndex * 100}%`);
  root.style.setProperty("--about-text-one", targetIndex === 0 ? "1" : "0");
  root.style.setProperty("--about-text-two", targetIndex === 1 ? "1" : "0");
  root.style.setProperty("--about-text-three", targetIndex === 2 ? "1" : "0");
  root.style.setProperty("--about-heading-one", targetIndex === 0 ? "1" : "0");
  root.style.setProperty("--about-heading-two", targetIndex === 1 ? "1" : "0");
  root.style.setProperty("--about-heading-three", targetIndex === 2 ? "1" : "0");

  animateScrollTo(getAboutScrollYForProgress(aboutSnapPoints[targetIndex]), 620, () => {
    aboutSnapAnimating = false;
    aboutSnapCooldownUntil = performance.now() + 520;
    window.setTimeout(() => {
      if (performance.now() >= aboutSnapCooldownUntil) {
        lockedAboutSnapIndex = null;
      }
    }, 540);
  });

  return true;
}

function updateAboutScene() {
  if (!aboutSection) return;

  const rect = aboutSection.getBoundingClientRect();
  const scrollable = Math.max(aboutSection.offsetHeight - window.innerHeight, 1);
  const progress = clamp(-rect.top / scrollable, 0, 1);
  const aboutIsActive = rect.top <= window.innerHeight * 0.45;
  if (aboutSnapAnimating || lockedAboutSnapIndex !== null) {
    const snapIndex = lockedAboutSnapIndex ?? getNearestAboutSnapIndex(progress);
    root.style.setProperty("--about-track-x", `${snapIndex * 100}%`);
    root.style.setProperty("--about-text-one", snapIndex === 0 ? "1" : "0");
    root.style.setProperty("--about-text-two", snapIndex === 1 ? "1" : "0");
    root.style.setProperty("--about-text-three", snapIndex === 2 ? "1" : "0");
    root.style.setProperty("--about-heading-one", snapIndex === 0 ? "1" : "0");
    root.style.setProperty("--about-heading-two", snapIndex === 1 ? "1" : "0");
    root.style.setProperty("--about-heading-three", snapIndex === 2 ? "1" : "0");
    return;
  }

  const trackStep = steppedAboutTrack(progress);
  const firstContentIn = aboutIsActive ? 1 : 0;
  const textOne = firstContentIn * (1 - fadeRange(progress, 0.22, 0.38));
  const textTwo = fadeRange(progress, 0.4, 0.52) * (1 - fadeRange(progress, 0.6, 0.76));
  const textThree = fadeRange(progress, 0.72, 0.82);
  const headingOne = firstContentIn * (1 - fadeRange(progress, 0.22, 0.38));
  const headingTwo = fadeRange(progress, 0.4, 0.52) * (1 - fadeRange(progress, 0.6, 0.76));
  const headingThree = fadeRange(progress, 0.72, 0.82);

  root.style.setProperty("--about-track-x", `${(trackStep * 100).toFixed(2)}%`);
  root.style.setProperty("--about-text-one", textOne.toFixed(4));
  root.style.setProperty("--about-text-two", textTwo.toFixed(4));
  root.style.setProperty("--about-text-three", textThree.toFixed(4));
  root.style.setProperty("--about-heading-one", headingOne.toFixed(4));
  root.style.setProperty("--about-heading-two", headingTwo.toFixed(4));
  root.style.setProperty("--about-heading-three", headingThree.toFixed(4));
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
    updateAboutScene();
    ticking = false;
  });
}

function blockDownwardScroll(event) {
  if (aboutSnapAnimating) {
    event.preventDefault();
    return;
  }

  if (transitionScrollLocked && event.deltaY > 0) {
    event.preventDefault();
    return;
  }

  if (event.deltaY !== 0 && handleAboutSnap(event.deltaY)) {
    event.preventDefault();
  }
}

function rememberTouchStart(event) {
  touchStartY = event.touches[0]?.clientY ?? 0;
}

function blockDownwardTouchScroll(event) {
  const currentY = event.touches[0]?.clientY ?? touchStartY;
  const scrollDirection = touchStartY - currentY;

  if (aboutSnapAnimating) {
    event.preventDefault();
    return;
  }

  if (transitionScrollLocked && scrollDirection > 0) {
    event.preventDefault();
    return;
  }

  if (Math.abs(scrollDirection) > 8 && handleAboutSnap(scrollDirection)) {
    event.preventDefault();
    touchStartY = currentY;
  }
}

function blockDownwardKeys(event) {
  const downwardKeys = ["ArrowDown", "PageDown", " ", "End"];
  const upwardKeys = ["ArrowUp", "PageUp", "Home"];

  if (transitionScrollLocked && downwardKeys.includes(event.key)) {
    event.preventDefault();
    return;
  }

  if (aboutSnapAnimating && (downwardKeys.includes(event.key) || upwardKeys.includes(event.key))) {
    event.preventDefault();
    return;
  }

  if (downwardKeys.includes(event.key) && handleAboutSnap(1)) {
    event.preventDefault();
  }

  if (upwardKeys.includes(event.key) && handleAboutSnap(-1)) {
    event.preventDefault();
  }
}

window.addEventListener("scroll", requestLensUpdate, { passive: true });
window.addEventListener("resize", requestLensUpdate);
window.addEventListener("wheel", blockDownwardScroll, { passive: false });
window.addEventListener("touchstart", rememberTouchStart, { passive: true });
window.addEventListener("touchmove", blockDownwardTouchScroll, { passive: false });
window.addEventListener("keydown", blockDownwardKeys);

if (backToHero) {
  backToHero.addEventListener("click", (event) => {
    event.preventDefault();
    returningToHero = true;
    aboutTransitionStarted = false;
    transitionScrollLocked = false;
    window.scrollTo({
      top: getHeroShowcaseScrollY(),
      behavior: "smooth",
    });
  });
}

updateLens();
updateAboutScene();
