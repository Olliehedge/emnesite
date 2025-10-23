(() => {
  const viewport = document.querySelector(".carousel_viewport");
  if (!viewport) return;

  const track = viewport.querySelector(".carousel_track");
  if (!track) return;

  const originals = Array.from(track.querySelectorAll(".carousel_slide"));
  if (originals.length === 0) return;

  if (originals.length === 1) {
    // nothing to loop, just keep the slide centered
    requestAnimationFrame(() => {
      originals[0].style.setProperty("--scale", "1");
      originals[0].style.setProperty("--opacity", "1");
    });
    return;
  }

  const cloneSlide = (node) => node.cloneNode(true);

  originals
    .map(cloneSlide)
    .reverse()
    .forEach((clone) => track.insertBefore(clone, track.firstChild));

  originals.map(cloneSlide).forEach((clone) => track.appendChild(clone));

  let lastScrollTop = viewport.scrollTop;
  let activeDisplaySlide = null;

  let slideSpan = 0;
  let totalSpan = 0;
  const getRowGap = () => {
    const value = getComputedStyle(track).rowGap;
    if (!value || value === "normal") return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const measureSlides = () => {
    const gap = getRowGap();
    const totalHeight = originals.reduce(
      (sum, slide) => sum + (slide.offsetHeight || 0),
      0
    );
    const computedTotal =
      totalHeight + Math.max(originals.length - 1, 0) * gap;

    if (computedTotal > 0) {
      totalSpan = computedTotal;
      slideSpan = totalSpan / originals.length;
      return;
    }

    const fallback = viewport.clientHeight || window.innerHeight || 0;
    slideSpan = fallback;
    totalSpan = fallback * (originals.length || 1);
  };

  const attachVideoListeners = () => {
    track.querySelectorAll("video").forEach((video) => {
      if (video.readyState >= 1) return;
      video.addEventListener(
        "loadedmetadata",
        () => {
          measureSlides();
          jumpToMiddle();
          scheduleUpdate();
        },
        { once: true }
      );
    });
  };

  const baseSpan = () => totalSpan || originals.length * slideSpan;

  const jumpToMiddle = () => {
    viewport.scrollTop = baseSpan();
  };

  const MIN_SCALE = 0.005;
  const MAX_SCALE = 1;
  const MIN_OPACITY = 0.65;
  const MAX_OPACITY = 1;

  const setActiveDisplaySlide = (slide) => {
    if (activeDisplaySlide === slide) return;

    if (activeDisplaySlide) {
      const previousDisplay =
        activeDisplaySlide.querySelector(".carousel_display");
      previousDisplay?.classList.remove("is-visible");
    }

    activeDisplaySlide = slide || null;
    if (activeDisplaySlide) {
      const nextDisplay =
        activeDisplaySlide.querySelector(".carousel_display");
      nextDisplay?.classList.add("is-visible");
    }
  };

  const updateVisualState = () => {
    const viewportRect = viewport.getBoundingClientRect();
    const windowHeight = window.innerHeight || viewportRect.height || 1;
    const windowCenter = windowHeight / 2;
    const influenceRadius = windowHeight / 2 || 1;

    let bestSlide = null;
    let bestCoverage = -1;
    let bestRatio = Number.POSITIVE_INFINITY;

    track.querySelectorAll(".carousel_slide").forEach((slide) => {
      const rect = slide.getBoundingClientRect();
      const slideCenter = rect.top + rect.height / 2;
      const distance = Math.abs(windowCenter - slideCenter);
      const ratio = Math.min(distance / influenceRadius, 1);

      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, windowHeight);
      const visibleHeight = Math.max(visibleBottom - visibleTop, 0);
      const coverage = Math.min(visibleHeight / windowHeight, 1);

      const scale =
        MAX_SCALE - (MAX_SCALE - MIN_SCALE) * ratio;
      const opacity =
        MAX_OPACITY - (MAX_OPACITY - MIN_OPACITY) * ratio;

      slide.style.setProperty("--scale", scale.toFixed(3));
      slide.style.setProperty("--opacity", opacity.toFixed(3));

      if (
        coverage > bestCoverage + 0.001 ||
        (Math.abs(coverage - bestCoverage) < 0.001 && ratio < bestRatio)
      ) {
        bestCoverage = coverage;
        bestRatio = ratio;
        bestSlide = slide;
      }
    });

    setActiveDisplaySlide(bestSlide);
  };

  const clampScroll = () => {
    const span = baseSpan();
    if (!span) return false;

    const lowerLimit = span;
    const upperLimit = span * 2;

    const current = viewport.scrollTop;

    if (current < lowerLimit) {
      viewport.scrollTop = current + span;
      return true;
    }

    if (current >= upperLimit) {
      viewport.scrollTop = current - span;
      return true;
    }

    return false;
  };

  const scheduleUpdate = () => requestAnimationFrame(updateVisualState);

  const handleScroll = () => {
    const jumped = clampScroll();

    scheduleUpdate();
    if (jumped) scheduleUpdate();

    lastScrollTop = viewport.scrollTop;
  };

  const handleResize = () => {
    measureSlides();
    jumpToMiddle();
    scheduleUpdate();
  };

  viewport.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize);

  const init = () => {
    measureSlides();
    attachVideoListeners();
    jumpToMiddle();
    updateVisualState();
    lastScrollTop = viewport.scrollTop;
  };

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init, { once: true });
  }

})();
