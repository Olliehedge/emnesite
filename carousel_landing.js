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

  const displayTimers = new WeakMap();
  let lastScrollTop = viewport.scrollTop;
  let lastScrollTime = performance.now();
  let lastHoverTrigger = 0;

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

  const updateVisualState = () => {
    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.top + viewportRect.height / 2;
    const influenceRadius = viewportRect.height / 2 || 1;

    track.querySelectorAll(".carousel_slide").forEach((slide) => {
      const rect = slide.getBoundingClientRect();
      const slideCenter = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - slideCenter);
      const ratio = Math.min(distance / influenceRadius, 1);

      const scale =
        MAX_SCALE - (MAX_SCALE - MIN_SCALE) * ratio;
      const opacity =
        MAX_OPACITY - (MAX_OPACITY - MIN_OPACITY) * ratio;

      slide.style.setProperty("--scale", scale.toFixed(3));
      slide.style.setProperty("--opacity", opacity.toFixed(3));

    });
  };

  const clampScroll = () => {
    const span = baseSpan();
    if (!span) return false;

    const current = viewport.scrollTop;
    const lowerThreshold = span * 0.5;
    const upperThreshold = span * 2.5;

    if (current < lowerThreshold) {
      viewport.scrollTop = current + span;
      return true;
    }

    const scrollMax = viewport.scrollHeight - viewport.clientHeight;
    const effectiveUpper = Math.min(upperThreshold, scrollMax - span * 0.5);

    if (current > effectiveUpper) {
      viewport.scrollTop = current - span;
      return true;
    }

    return false;
  };

  const showDisplayForSlide = (slide) => {
    if (!slide) return;
    const display = slide.querySelector(".carousel_display");
    if (!display) return;

    display.classList.add("is-visible");
    if (displayTimers.has(display)) {
      clearTimeout(displayTimers.get(display));
    }

    const timeout = setTimeout(() => {
      display.classList.remove("is-visible");
      displayTimers.delete(display);
    }, 1500);

    displayTimers.set(display, timeout);
  };

  const scheduleUpdate = () => requestAnimationFrame(updateVisualState);

  const handleScroll = () => {
    const jumped = clampScroll();

    scheduleUpdate();
    if (jumped) scheduleUpdate();

    lastScrollTop = viewport.scrollTop;
    lastScrollTime = performance.now();
  };

  const HOVER_COOLDOWN = 400;

  const handlePointerHover = (event) => {
    const slide = event.target.closest(".carousel_slide");
    if (!slide) return;

    const now = performance.now();
    if (now - lastHoverTrigger < HOVER_COOLDOWN) return;
    lastHoverTrigger = now;

    showDisplayForSlide(slide);
  };

  const handleResize = () => {
    measureSlides();
    jumpToMiddle();
    scheduleUpdate();
  };

  viewport.addEventListener("scroll", handleScroll, { passive: true });
  viewport.addEventListener("pointermove", handlePointerHover, { passive: true });
  viewport.addEventListener("pointerover", handlePointerHover, { passive: true });
  window.addEventListener("resize", handleResize);

  const init = () => {
    measureSlides();
    attachVideoListeners();
    jumpToMiddle();
    updateVisualState();
    lastScrollTop = viewport.scrollTop;
    lastScrollTime = performance.now();
    lastHoverTrigger = performance.now();
  };

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init, { once: true });
  }

})();
