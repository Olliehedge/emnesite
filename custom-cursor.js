(() => {
  const cursor = document.querySelector(".custom-cursor");
  if (!cursor) return;

  const interactiveSelector = "a, button";
  let linkHoverDepth = 0;
  let hideZoneDepth = 0;

  const moveCursor = (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  };

  const showCursor = () => cursor.classList.remove("custom-cursor--hidden");
  const hideCursor = () => {
    cursor.classList.add("custom-cursor--hidden");
    linkHoverDepth = 0;
    cursor.classList.remove("custom-cursor--link");
  };
  const activateLinkState = () => {
    linkHoverDepth += 1;
    cursor.classList.add("custom-cursor--link");
  };
  const deactivateLinkState = () => {
    linkHoverDepth = Math.max(linkHoverDepth - 1, 0);
    if (linkHoverDepth === 0) {
      cursor.classList.remove("custom-cursor--link");
    }
  };

  document.addEventListener("pointermove", (event) => {
    moveCursor(event);
    if (hideZoneDepth === 0) {
      showCursor();
    }
  });

  document.addEventListener("mouseenter", showCursor);
  document.addEventListener("mouseleave", hideCursor);

  const registerInteractiveTargets = () => {
    document.querySelectorAll(interactiveSelector).forEach((interactive) => {
      interactive.addEventListener("pointerenter", activateLinkState);
      interactive.addEventListener("pointerleave", deactivateLinkState);
    });
  };

  const isHideZone = (element) => {
    if (!element) return false;
    if (element.closest(".cursor-hide-zone")) return true;
    return element.tagName === "IFRAME";
  };

  document.addEventListener(
    "pointerover",
    (event) => {
      const target = event.target;
      if (!isHideZone(target)) return;
      const from = event.relatedTarget;
      if (isHideZone(from)) return;
      hideZoneDepth += 1;
      hideCursor();
    },
    true
  );

  document.addEventListener(
    "pointerout",
    (event) => {
      const target = event.target;
      if (!isHideZone(target)) return;
      const to = event.relatedTarget;
      if (isHideZone(to)) return;
      hideZoneDepth = Math.max(hideZoneDepth - 1, 0);
      if (hideZoneDepth === 0) {
        showCursor();
      }
    },
    true
  );

  registerInteractiveTargets();
})();
