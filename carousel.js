(function () {
  const carousels = document.querySelectorAll("[data-carousel]");
  if (!carousels.length) {
    return;
  }

  const clampIndex = (index, length) => {
    if (!length) {
      return 0;
    }
    return (index + length) % length;
  };

  carousels.forEach((carousel) => {
    const track = carousel.querySelector("[data-carousel-track]");
    const slides = Array.from(track ? track.children : []);
    if (!track || slides.length === 0) {
      return;
    }

    let activeIndex = slides.findIndex((slide) =>
      slide.classList.contains("is-active"),
    );
    let isTransitioning = false;
    let wheelTimeoutId;
    activeIndex = activeIndex >= 0 ? activeIndex : 0;

    const setActiveSlide = (targetIndex) => {
      activeIndex = clampIndex(targetIndex, slides.length);
      const offset = activeIndex * 100;
      track.style.transform = `translateY(-${offset}%)`;

      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.classList.toggle("is-active", isActive);

        const video = slide.querySelector("video");
        if (!video) {
          return;
        }

        if (isActive) {
          if (video.paused) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.then === "function") {
              playPromise.catch(() => {});
            }
          }
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    const handleChange = (direction) => {
      if (isTransitioning) {
        return;
      }

      isTransitioning = true;
      setActiveSlide(activeIndex + direction);
      window.setTimeout(() => {
        isTransitioning = false;
      }, 650);
    };

    const buttons = carousel.querySelectorAll("[data-carousel-button]");
    buttons.forEach((button) => {
      const direction = button.dataset.carouselButton === "next" ? 1 : -1;
      button.addEventListener("click", () => {
        handleChange(direction);
      });
    });

    const handleWheel = (event) => {
      event.preventDefault();
      if (wheelTimeoutId) {
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      handleChange(direction);
      wheelTimeoutId = window.setTimeout(() => {
        wheelTimeoutId = undefined;
      }, 700);
    };

    carousel.addEventListener("wheel", handleWheel, { passive: false });

    let touchStartY = null;
    const touchThreshold = 50;

    carousel.addEventListener("touchstart", (event) => {
      touchStartY = event.touches[0].clientY;
    });

    carousel.addEventListener("touchmove", (event) => {
      if (touchStartY === null) {
        return;
      }

      const deltaY = touchStartY - event.touches[0].clientY;
      if (Math.abs(deltaY) < touchThreshold) {
        return;
      }

      handleChange(deltaY > 0 ? 1 : -1);
      touchStartY = null;
    });

    carousel.addEventListener("touchend", () => {
      touchStartY = null;
    });

    slides.forEach((slide, index) => {
      slide.addEventListener("transitionend", () => {
        if (index !== activeIndex) {
          return;
        }

        const video = slide.querySelector("video");
        if (!video || !video.paused) {
          return;
        }

        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch(() => {});
        }
      });
    });

    setActiveSlide(activeIndex);
  });
})();
