(function () {
  const loaderEl = document.getElementById("loader");
  const counterEl = document.getElementById("loaderCounter");
  const barEl = document.getElementById("loaderBar");
  if (!loaderEl || !counterEl || !barEl) return;

  document.body.classList.add("loader-active");

  let current = 0;
  const duration = 2200;
  const startedAt = performance.now();

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function tick(now) {
    const elapsed = now - startedAt;
    const raw = Math.min(elapsed / duration, 1);
    const eased = easeOutQuart(raw);
    const value = Math.floor(eased * 100);

    if (value !== current) {
      current = value;
      counterEl.textContent = current;
      barEl.style.width = current + "%";
    }

    if (raw < 1) {
      requestAnimationFrame(tick);
    } else {
      counterEl.textContent = "100";
      barEl.style.width = "100%";
      setTimeout(function () {
        loaderEl.classList.add("is-done");
        document.body.classList.remove("loader-active");
        loaderEl.addEventListener("transitionend", function onEnd(e) {
          if (e.target === loaderEl.querySelector(".loader-curtain-bottom")) {
            loaderEl.classList.add("is-gone");
            loaderEl.removeEventListener("transitionend", onEnd);
          }
        });
      }, 180);
    }
  }

  requestAnimationFrame(tick);
})();

const root = document.documentElement;
const hero = document.querySelector(".hero");
const aboutSection = document.querySelector("#about");
const projectsSection = document.querySelector("#projects");
const revealItems = document.querySelectorAll(".reveal");
const backToHeroLinks = document.querySelectorAll(".back-to-hero");
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
let projectsEntryHandled = false;
let projectsEntryAnimating = false;
let projectsExitPauseHandled = false;
let projectsExitPauseUntil = 0;

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

function getProjectsScrollY() {
  if (!projectsSection) return window.scrollY;
  return projectsSection.getBoundingClientRect().top + window.scrollY;
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

function isAboutSectionVisible() {
  if (!aboutSection) return false;

  const rect = aboutSection.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

function startProjectsEntry() {
  projectsEntryHandled = true;
  projectsEntryAnimating = true;
  lockedAboutSnapIndex = aboutSnapPoints.length - 1;
  root.style.setProperty("--about-track-x", `${lockedAboutSnapIndex * 100}%`);
  root.style.setProperty("--about-text-one", "0");
  root.style.setProperty("--about-text-two", "0");
  root.style.setProperty("--about-text-three", "1");
  root.style.setProperty("--about-heading-one", "0");
  root.style.setProperty("--about-heading-two", "0");
  root.style.setProperty("--about-heading-three", "1");

  animateScrollTo(getProjectsScrollY(), 760, () => {
    projectsEntryAnimating = false;
    lockedAboutSnapIndex = null;
  });
}

function handleProjectsExitPause(direction) {
  if (!projectsSection || direction <= 0) return false;

  const now = performance.now();
  if (now < projectsExitPauseUntil) return true;
  if (projectsExitPauseHandled) return false;

  const rect = projectsSection.getBoundingClientRect();
  const projectsIsCurrentScreen =
    rect.top <= window.innerHeight * 0.16 &&
    rect.bottom >= window.innerHeight * 0.16;

  if (!projectsIsCurrentScreen) return false;

  projectsExitPauseHandled = true;
  projectsExitPauseUntil = now + 950;
  return true;
}

function handleAboutSnap(direction) {
  if (projectsEntryAnimating) return true;

  const currentProgress = getAboutProgress();
  const currentIndex = getNearestAboutSnapIndex(currentProgress);
  const targetIndex = currentIndex + (direction > 0 ? 1 : -1);
  const lastAboutIndex = aboutSnapPoints.length - 1;
  const isLeavingLastAboutScreen =
    direction > 0 &&
    projectsSection &&
    !projectsEntryHandled &&
    isAboutSectionVisible() &&
    currentProgress >= aboutSnapPoints[lastAboutIndex] - 0.025;

  if (isLeavingLastAboutScreen) {
    startProjectsEntry();
    return true;
  }

  if (!isAboutSnapActive()) return false;

  if (aboutSnapAnimating || performance.now() < aboutSnapCooldownUntil) return true;

  if (targetIndex >= aboutSnapPoints.length && direction > 0 && projectsSection && !projectsEntryHandled) {
    startProjectsEntry();
    return true;
  }

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
  if (projectsEntryAnimating) {
    event.preventDefault();
    return;
  }

  if (handleProjectsExitPause(event.deltaY)) {
    event.preventDefault();
    return;
  }

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

  if (projectsEntryAnimating) {
    event.preventDefault();
    return;
  }

  if (aboutSnapAnimating) {
    event.preventDefault();
    return;
  }

  if (transitionScrollLocked && scrollDirection > 0) {
    event.preventDefault();
    return;
  }

  if (Math.abs(scrollDirection) > 8 && handleProjectsExitPause(scrollDirection)) {
    event.preventDefault();
    touchStartY = currentY;
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

  if (projectsEntryAnimating && (downwardKeys.includes(event.key) || upwardKeys.includes(event.key))) {
    event.preventDefault();
    return;
  }

  if (transitionScrollLocked && downwardKeys.includes(event.key)) {
    event.preventDefault();
    return;
  }

  if (downwardKeys.includes(event.key) && handleProjectsExitPause(1)) {
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

for (const backToHeroLink of backToHeroLinks) {
  backToHeroLink.addEventListener("click", (event) => {
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

// ─── Envelope Scene ─────────────────────────────────────────────────────────

(function initEnvelopeScene() {
  const scene = document.getElementById('envelopeScene');
  if (!scene) return;

  const canvas = document.getElementById('envCanvas');
  const papersEl = document.getElementById('envPapers');
  const hintEl = document.getElementById('envHint');
  const progressEl = document.getElementById('envProgress');
  const progressFill = document.getElementById('envProgressFill');
  const progressLabel = document.getElementById('progressLabel') || document.getElementById('envProgressLabel') || progressEl.querySelector('span');
  hintEl.style.opacity = '0';

  // Create cursor
  const cursorEl = document.createElement('div');
  cursorEl.className = 'env-cursor';
  cursorEl.innerHTML = `
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="10" cy="9" r="3.2" stroke="rgba(244,241,235,0.92)" stroke-width="2"/>
      <circle cx="10" cy="23" r="3.2" stroke="rgba(244,241,235,0.92)" stroke-width="2"/>
      <path d="M13 12.5 28 4.5" stroke="rgba(244,241,235,0.92)" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M13 19.5 28 27.5" stroke="rgba(244,241,235,0.92)" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M13.2 14 28 16 13.2 18" stroke="rgba(168,85,247,0.96)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  scene.appendChild(cursorEl);
  let lastTrailX = null;
  let lastTrailY = null;

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    const r = scene.getBoundingClientRect();
    W = canvas.width = r.width;
    H = canvas.height = r.height;
    drawEnvelope();
  }

  const ENV_W = 680, ENV_H = 420;
  let envX, envY;
  let cutProgress = 0;
  let isOpen = false;
  let papersDropped = false;
  let mouseOnEnv = false;
  let envelopeIntro = 0;
  let envelopeExit = 0;
  let envelopeIntroStarted = false;
  let envelopeExitStarted = false;
  let envelopeReady = false;

  const projects = [
    {
      title: "Featured Interface", number: "01",
      desc: "Güçlü tipografi, kontrollü animasyon ve net proje anlatımı.",
      tag: "UI/UX", tagColor: "#5b2aa0", tagBg: "#ede9fe",
      accent: "#7c3aed",
      imgColors: ["#c4b5fd", "#8b5cf6", "#7c3aed", "#4c1d95"]
    },
    {
      title: "Interactive Build", number: "02",
      desc: "Scroll geçişleri ve mikro etkileşimlerle desteklenmiş sistem.",
      tag: "Frontend", tagColor: "#0f6e56", tagBg: "#d1fae5",
      accent: "#10b981",
      imgColors: ["#6ee7b7", "#34d399", "#10b981", "#065f46"]
    },
    {
      title: "Visual System", number: "03",
      desc: "Marka ve portfolyo sunumları için görsel ağırlıklı çalışma.",
      tag: "Branding", tagColor: "#993c1d", tagBg: "#fde9e0",
      accent: "#f97316",
      imgColors: ["#fed7aa", "#fb923c", "#ea580c", "#9a3412"]
    },
    {
      title: "Motion Story", number: "04",
      desc: "Scroll ritmi, gecis hissi ve sahne anlatimi odakli prototip.",
      tag: "Motion", tagColor: "#5b21b6", tagBg: "#ede9fe",
      accent: "#a855f7",
      imgColors: ["#f5d0fe", "#d946ef", "#9333ea", "#581c87"]
    },
    {
      title: "Creative Lab", number: "05",
      desc: "Deneysel arayuz fikirleri ve mikro etkilesimler icin oyun alani.",
      tag: "Lab", tagColor: "#075985", tagBg: "#e0f2fe",
      accent: "#0ea5e9",
      imgColors: ["#bae6fd", "#38bdf8", "#0284c7", "#0c4a6e"]
    },
    {
      title: "Portfolio System", number: "06",
      desc: "Kisisel marka, proje sunumu ve iletisim akisini birlestiren sistem.",
      tag: "System", tagColor: "#854d0e", tagBg: "#fef3c7",
      accent: "#f59e0b",
      imgColors: ["#fde68a", "#fbbf24", "#d97706", "#78350f"]
    },
    {
      title: "", number: "07",
      desc: "",
      tag: "", tagColor: "#5f6368", tagBg: "#e5e7eb",
      accent: "#8f949b",
      imgColors: ["#f3f4f6", "#d1d5db", "#9ca3af", "#4b5563"]
    },
    {
      title: "", number: "08",
      desc: "",
      tag: "", tagColor: "#5f6368", tagBg: "#e5e7eb",
      accent: "#8f949b",
      imgColors: ["#f8fafc", "#cbd5e1", "#94a3b8", "#475569"]
    },
    {
      title: "", number: "09",
      desc: "",
      tag: "", tagColor: "#5f6368", tagBg: "#e5e7eb",
      accent: "#8f949b",
      imgColors: ["#f4f4f5", "#d4d4d8", "#a1a1aa", "#52525b"]
    },
    {
      title: "", number: "10",
      desc: "",
      tag: "", tagColor: "#5f6368", tagBg: "#e5e7eb",
      accent: "#8f949b",
      imgColors: ["#f5f5f5", "#d6d3d1", "#a8a29e", "#57534e"]
    }
  ];

  let draggedPaper = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let paperLayer = 120;

  function randomPaperRotation() {
    return (Math.random() - 0.5) * 18;
  }

  function attachDraggablePaper(el) {
    el.addEventListener("pointerdown", (event) => startPaperDrag(event, el));
    el.addEventListener("pointermove", movePaperDrag);
    el.addEventListener("pointerup", endPaperDrag);
    el.addEventListener("pointercancel", endPaperDrag);
  }

  const paperDropZones = [
    [0.15, 0.36],
    [0.36, 0.34],
    [0.61, 0.35],
    [0.84, 0.37],
    [0.24, 0.57],
    [0.49, 0.6],
    [0.74, 0.58],
    [0.14, 0.76],
    [0.43, 0.78],
    [0.78, 0.76],
  ];

  function startPaperDrag(event, paper) {
    if (paper.dataset.draggable !== "true") return;

    event.preventDefault();
    draggedPaper = paper;
    const sceneRect = scene.getBoundingClientRect();
    const paperRect = paper.getBoundingClientRect();
    dragOffsetX = event.clientX - paperRect.left;
    dragOffsetY = event.clientY - paperRect.top;
    paper.style.left = `${paperRect.left - sceneRect.left}px`;
    paper.style.top = `${paperRect.top - sceneRect.top}px`;
    paper.style.zIndex = String(++paperLayer);
    paper.classList.add("is-dragging");
    paper.setPointerCapture(event.pointerId);
  }

  function movePaperDrag(event) {
    if (!draggedPaper) return;

    const sceneRect = scene.getBoundingClientRect();
    const nextX = Math.max(0, Math.min(event.clientX - sceneRect.left - dragOffsetX, sceneRect.width - draggedPaper.offsetWidth));
    const nextY = Math.max(0, Math.min(event.clientY - sceneRect.top - dragOffsetY, sceneRect.height - draggedPaper.offsetHeight));
    draggedPaper.style.left = `${nextX}px`;
    draggedPaper.style.top = `${nextY}px`;
    draggedPaper.style.setProperty("--paper-rotation", `${Number(draggedPaper.dataset.rotation || 0) * 0.35}deg`);
    draggedPaper.style.transform = `rotate(var(--paper-rotation)) scale(1.03)`;
  }

  function endPaperDrag(event) {
    if (!draggedPaper) return;

    const nextRotation = randomPaperRotation();
    draggedPaper.dataset.rotation = String(nextRotation);
    draggedPaper.style.setProperty("--paper-rotation", `${nextRotation}deg`);
    draggedPaper.classList.remove("is-dragging");
    draggedPaper.style.transform = `rotate(var(--paper-rotation)) scale(var(--paper-scale, 1))`;
    if (event && typeof draggedPaper.releasePointerCapture === "function") {
      try {
        draggedPaper.releasePointerCapture(event.pointerId);
      } catch (_) {
        // Pointer capture may already be released by the browser.
      }
    }
    draggedPaper = null;
  }

  function drawProjectCanvas(c, colors) {
    const cx = c.getContext('2d');
    const w = c.width = 220, h = c.height = 135;
    const g = cx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, colors[0]); g.addColorStop(0.4, colors[1]);
    g.addColorStop(0.75, colors[2]); g.addColorStop(1, colors[3]);
    cx.fillStyle = g; cx.fillRect(0, 0, w, h);
    cx.strokeStyle = 'rgba(255,255,255,0.15)'; cx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      cx.beginPath(); cx.moveTo(0, 18 + i*20); cx.lineTo(w, 10 + i*20); cx.stroke();
    }
    cx.fillStyle = 'rgba(255,255,255,0.12)';
    cx.beginPath(); cx.arc(w*0.7, h*0.35, 26, 0, Math.PI*2); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,0.08)';
    cx.beginPath(); cx.roundRect(14, h*0.6, 55, 14, 3); cx.fill();
  }

  function createPaper(proj, index) {
    const el = document.createElement('div');
    el.className = 'env-paper';

    const inner = document.createElement('div');
    inner.className = 'env-paper-inner';

    const bar = document.createElement('div');
    bar.className = 'env-paper-bar';
    bar.style.background = proj.accent;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'env-paper-img';
    const c = document.createElement('canvas');
    imgWrap.appendChild(c);
    drawProjectCanvas(c, proj.imgColors);

    const num = document.createElement('div');
    num.className = 'env-paper-num';
    num.style.color = proj.accent;
    num.textContent = proj.number;

    const title = document.createElement('div');
    title.className = 'env-paper-title';
    title.textContent = proj.title || " ";

    const desc = document.createElement('div');
    desc.className = 'env-paper-desc';
    desc.textContent = proj.desc || " ";

    const tag = document.createElement('div');
    tag.className = 'env-paper-tag';
    tag.style.background = proj.tagBg;
    tag.style.color = proj.tagColor;
    tag.textContent = proj.tag || " ";

    inner.appendChild(bar); inner.appendChild(imgWrap);
    inner.appendChild(num); inner.appendChild(title);
    inner.appendChild(desc); inner.appendChild(tag);
    el.appendChild(inner);
    attachDraggablePaper(el);

    const paperW = 220;
    const paperH = 292;
    const [zoneX, zoneY] = paperDropZones[index % paperDropZones.length];
    const scatterX = (Math.random() - 0.5) * 0.08;
    const scatterY = (Math.random() - 0.5) * 0.06;
    const targetX = clamp(
      W * (zoneX + scatterX) - paperW / 2,
      16,
      Math.max(16, W - paperW - 16)
    );
    const targetY = clamp(
      H * (zoneY + scatterY) - paperH / 2,
      18,
      Math.max(18, H - paperH - 18)
    );
    const targetRot = randomPaperRotation();

    el.style.left = envX + (ENV_W / 2 - paperW / 2) + 'px';
    el.style.top = envY + ENV_H * 0.45 + 'px';
    el.style.zIndex = String(20 + index);
    el.dataset.rotation = String(targetRot);

    papersEl.style.pointerEvents = 'auto';

    setTimeout(() => {
      el.style.opacity = '1';
      const startX = parseFloat(el.style.left);
      const startY = parseFloat(el.style.top);
      const startRot = (Math.random() - 0.5) * 6;
      const duration = 820 + Math.random() * 260;
      const arcHeight = 48 + Math.random() * 18;
      const startedAt = performance.now();

      function fall(now) {
        const progress = clamp((now - startedAt) / duration, 0, 1);
        const eased = easeInOutCubic(progress);
        const arc = Math.sin(progress * Math.PI) * arcHeight;
        const x = startX + (targetX - startX) * eased;
        const y = startY + (targetY - startY) * eased - arc;
        const rot = startRot + (targetRot - startRot) * eased;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty("--paper-rotation", `${rot}deg`);
        el.style.transform = `rotate(var(--paper-rotation)) scale(var(--paper-scale, 1))`;

        if (progress < 1) {
          requestAnimationFrame(fall);
        } else {
          el.style.top = targetY + 'px';
          el.style.left = targetX + 'px';
          el.style.setProperty("--paper-rotation", `${targetRot}deg`);
          el.style.transform = `rotate(var(--paper-rotation)) scale(var(--paper-scale, 1))`;
          el.dataset.draggable = "true";
        }
      }
      requestAnimationFrame(fall);
    }, index * 140 + 220);

    return el;
  }

  function createQuestionText() {
    const el = document.createElement('div');
    el.className = 'env-paper env-text-card';
    el.innerHTML = '<span>Neler yaptın Emre?</span>';
    attachDraggablePaper(el);

    const textW = Math.min(380, W - 44);
    const textH = 56;
    const targetX = clamp(W * 0.5 - textW / 2, 16, Math.max(16, W - textW - 16));
    const targetY = clamp(H * 0.28 - textH / 2, 18, Math.max(18, H - textH - 18));
    const targetRot = 0;

    el.style.left = envX + (ENV_W / 2 - textW / 2) + 'px';
    el.style.top = envY + ENV_H * 0.48 + 'px';
    el.style.zIndex = String(++paperLayer);
    el.dataset.rotation = String(targetRot);
    papersEl.style.pointerEvents = 'auto';

    setTimeout(() => {
      el.style.opacity = '1';
      const startX = parseFloat(el.style.left);
      const startY = parseFloat(el.style.top);
      const duration = 960;
      const arcHeight = 58;
      const startedAt = performance.now();

      function fall(now) {
        const progress = clamp((now - startedAt) / duration, 0, 1);
        const eased = easeInOutCubic(progress);
        const arc = Math.sin(progress * Math.PI) * arcHeight;
        const x = startX + (targetX - startX) * eased;
        const y = startY + (targetY - startY) * eased - arc;
        const rot = targetRot * eased;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty("--paper-rotation", `${rot}deg`);
        el.style.transform = `rotate(var(--paper-rotation)) scale(var(--paper-scale, 1))`;

        if (progress < 1) {
          requestAnimationFrame(fall);
        } else {
          el.style.left = `${targetX}px`;
          el.style.top = `${targetY}px`;
          el.style.setProperty("--paper-rotation", `${targetRot}deg`);
          el.style.transform = `rotate(var(--paper-rotation)) scale(var(--paper-scale, 1))`;
          el.dataset.draggable = "true";
        }
      }

      requestAnimationFrame(fall);
    }, projects.length * 140 + 520);

    return el;
  }

  function drawEnvelope() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    envX = (W - ENV_W) / 2;
    envY = -ENV_H * (1.62 - envelopeIntro * 1.12 + envelopeExit * 1.12);
    const ex = envX, ey = envY, ew = ENV_W, eh = ENV_H;
    const cx2 = ex + ew / 2, cy = ey + eh / 2;

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#1a1a1f';
    ctx.beginPath();
    ctx.roundRect(ex, ey, ew, eh, 6);
    ctx.fill();
    ctx.restore();

    // Back flap
    ctx.fillStyle = '#141417';
    ctx.beginPath();
    ctx.moveTo(ex, ey); ctx.lineTo(ex + ew, ey); ctx.lineTo(cx2, ey + eh * 0.52); ctx.closePath();
    ctx.fill();

    // Left flap
    ctx.fillStyle = '#17171b';
    ctx.beginPath();
    ctx.moveTo(ex, ey); ctx.lineTo(ex, ey + eh); ctx.lineTo(cx2 - 15, cy); ctx.closePath();
    ctx.fill();

    // Right flap
    ctx.fillStyle = '#161619';
    ctx.beginPath();
    ctx.moveTo(ex + ew, ey); ctx.lineTo(ex + ew, ey + eh); ctx.lineTo(cx2 + 15, cy); ctx.closePath();
    ctx.fill();

    // Bottom flap
    ctx.fillStyle = '#1c1c21';
    ctx.beginPath();
    ctx.moveTo(ex, ey + eh); ctx.lineTo(ex + ew, ey + eh); ctx.lineTo(cx2, cy + 10); ctx.closePath();
    ctx.fill();

    // Top flap. When open, mirror the same V flap downward from the envelope's lower edge.
    const flapBaseY = isOpen ? ey + eh : ey;
    const flapTipY = isOpen ? ey + eh * 1.52 : ey + eh * 0.52;
    ctx.fillStyle = isOpen ? 'rgba(26,26,31,0.34)' : '#1a1a1f';
    ctx.beginPath();
    ctx.moveTo(ex, flapBaseY);
    ctx.lineTo(ex + ew, flapBaseY);
    ctx.lineTo(cx2, flapTipY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(244,241,235,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ex, flapBaseY);
    ctx.lineTo(ex + ew, flapBaseY);
    ctx.lineTo(cx2, flapTipY);
    ctx.closePath();
    ctx.stroke();

    // Border
    ctx.strokeStyle = 'rgba(244,241,235,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(ex, ey, ew, eh, 6);
    ctx.stroke();

    // Seal
    if (!isOpen) {
      const sx = cx2, sy = ey + eh * 0.5;
      ctx.fillStyle = '#2d0f57';
      ctx.strokeStyle = 'rgba(168,85,247,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 14); ctx.lineTo(sx + 14, sy); ctx.lineTo(sx, sy + 14); ctx.lineTo(sx - 14, sy); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(168,85,247,0.9)';
      ctx.font = '800 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EU', sx, sy + 1);
    }

    // Cut line
    if (cutProgress > 0 && !isOpen) {
      const totalLen = ew;
      const drawn = cutProgress * totalLen;

      ctx.save();
      ctx.shadowColor = 'rgba(168,85,247,0.9)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(168,85,247,0.95)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + drawn, ey);
      ctx.stroke();

      // Glow dot at cut tip
      ctx.fillStyle = 'rgba(168,85,247,1)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ex + drawn, ey, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnSparkle(x, y) {
    const s = document.createElement('div');
    s.className = 'env-sparkle';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    scene.appendChild(s);
    let start = null;
    function anim(ts) {
      if (!start) start = ts;
      const p = (ts - start) / 480;
      if (p >= 1) { s.remove(); return; }
      const dx = (Math.random() - 0.5) * 18 * p;
      const dy = -35 * p;
      s.style.transform = `translate(${dx}px, ${dy}px) scale(${1 - p})`;
      s.style.opacity = String(1 - p);
      requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  }

  function openEnvelope() {
    isOpen = true;
    scene.classList.add("is-open");
    cursorEl.style.opacity = '0';
    hintEl.style.opacity = '0';
    progressEl.classList.remove('visible');

    let flapFrame = 0;
    function animateFlap() {
      flapFrame++;
      drawEnvelope();
      if (flapFrame < 30) requestAnimationFrame(animateFlap);
    }
    requestAnimationFrame(animateFlap);

    setTimeout(() => {
      if (!papersDropped) {
        papersDropped = true;
        projects.forEach((proj, i) => {
          const paper = createPaper(proj, i);
          papersEl.appendChild(paper);
        });
        papersEl.appendChild(createQuestionText());
        window.setTimeout(startEnvelopeExit, 2050);
      }
    }, 300);
  }

  let animFrame = null;
  function requestDraw() {
    if (animFrame) return;
    animFrame = requestAnimationFrame(() => { drawEnvelope(); animFrame = null; });
  }

  function startEnvelopeExit() {
    if (envelopeExitStarted) return;

    envelopeExitStarted = true;
    const startedAt = performance.now();
    const duration = 1050;

    function step(now) {
      const progress = clamp((now - startedAt) / duration, 0, 1);
      envelopeExit = easeInOutCubic(progress);
      drawEnvelope();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function spawnCursorTrail(x, y) {
    if (lastTrailX === null || lastTrailY === null) {
      lastTrailX = x;
      lastTrailY = y;
      return;
    }

    const dx = x - lastTrailX;
    const dy = y - lastTrailY;
    const length = Math.hypot(dx, dy);
    if (length < 8) return;

    const trail = document.createElement('div');
    trail.className = 'env-cursor-trail';
    trail.style.left = `${lastTrailX}px`;
    trail.style.top = `${lastTrailY}px`;
    trail.style.width = `${Math.min(length, 42)}px`;
    trail.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    scene.appendChild(trail);
    window.setTimeout(() => trail.remove(), 420);
    lastTrailX = x;
    lastTrailY = y;
  }

  function animateEnvelopeIntro() {
    if (envelopeIntroStarted) return;

    envelopeIntroStarted = true;
    const startedAt = performance.now();
    const duration = 1050;
    const delay = 180;

    function step(now) {
      const elapsed = now - startedAt - delay;
      const raw = Math.max(0, Math.min(elapsed / duration, 1));
      envelopeIntro = easeInOutCubic(raw);
      drawEnvelope();

      if (raw < 1) {
        requestAnimationFrame(step);
      } else {
        envelopeReady = true;
        hintEl.style.opacity = '1';
      }
    }

    requestAnimationFrame(step);
  }

  const envelopeIntroObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.82) {
          animateEnvelopeIntro();
          envelopeIntroObserver.disconnect();
        }
      }
    },
    { threshold: [0.82] }
  );

  envelopeIntroObserver.observe(scene);

  scene.addEventListener('mousemove', (e) => {
    const rect = scene.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    cursorEl.style.left = mx + 'px';
    cursorEl.style.top = my + 'px';
    if (!isOpen) {
      cursorEl.style.opacity = '1';
      spawnCursorTrail(mx, my);
    }

    if (isOpen || !envelopeReady) return;

    const visibleEnvTop = Math.max(envY, 0);
    const onEnv = mx >= envX - 8 && mx <= envX + ENV_W + 8 && my >= visibleEnvTop - 8 && my <= envY + ENV_H + 8;

    if (onEnv) {
      if (!mouseOnEnv) {
        mouseOnEnv = true;
        progressEl.classList.add('visible');
        hintEl.style.opacity = '0';
      }

      const normX = (mx - envX) / ENV_W;
      const newProgress = Math.max(cutProgress, Math.min(1, normX));

      if (newProgress > cutProgress) {
        cutProgress = newProgress;
        progressFill.style.width = (cutProgress * 100) + '%';
        if (progressLabel) progressLabel.textContent = Math.round(cutProgress * 100) + '%';

        if (cutProgress > 0.04 && cutProgress < 0.96 && Math.random() > 0.5) {
          spawnSparkle(mx, my);
        }

        requestDraw();

        if (cutProgress >= 0.93 && !isOpen) {
          openEnvelope();
        }
      }
    } else {
      if (mouseOnEnv && !isOpen) mouseOnEnv = false;
    }
  });

  scene.addEventListener('mouseleave', () => {
    cursorEl.style.opacity = '0';
    lastTrailX = null;
    lastTrailY = null;
  });

  window.addEventListener('resize', () => {
    resize();
  });

  resize();
})();
