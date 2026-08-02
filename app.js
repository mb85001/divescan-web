(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav toggle ---------- */

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Header scroll state ---------- */

  var header = document.getElementById("siteHeader");
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  /* ---------- Scroll reveal ---------- */

  var revealTargets = document.querySelectorAll("[data-reveal], [data-reveal-group], [data-reveal-observe]");

  if ("IntersectionObserver" in window && revealTargets.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Hero: loaded state for the floating chips ---------- */

  var heroVisual = document.getElementById("heroVisual");
  if (heroVisual) {
    requestAnimationFrame(function () {
      heroVisual.classList.add("is-loaded");
    });
  }

  /* ---------- Scroll-linked motion (depth gauge + dive profile) ---------- */

  function scrollProgress(el) {
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight;
    var start = vh;
    var end = -rect.height;
    var raw = (start - rect.top) / (start - end);
    return Math.min(1, Math.max(0, raw));
  }

  var depthFill = document.getElementById("depthFill");
  var depthReadout = document.getElementById("depthReadout");
  var diveProfileEl = document.querySelector(".dive-profile");
  var divePath = document.getElementById("diveProfilePath");
  var diveMarkers = document.querySelectorAll(".dive-profile__marker");
  var diveSteps = document.querySelectorAll(".step");
  var stepThresholds = [0.02, 0.34, 0.66, 0.98];
  var hoverStepIndex = null;
  var seekTimeout = null;
  var pathLength = 0;

  if (divePath && !reduceMotion) {
    try {
      pathLength = divePath.getTotalLength();
      divePath.style.strokeDasharray = pathLength;
      divePath.style.strokeDashoffset = pathLength;
    } catch (e) {
      pathLength = 0;
    }
  } else {
    diveMarkers.forEach(function (marker) {
      marker.classList.add("is-active");
    });
    diveSteps.forEach(function (step) {
      step.classList.add("is-active");
    });
  }

  var ticking = false;

  function updateScrollEffects() {
    ticking = false;

    if (depthFill && depthReadout) {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var pageProgress = scrollable > 0 ? window.scrollY / scrollable : 0;
      pageProgress = Math.min(1, Math.max(0, pageProgress));
      var depth = Math.round(pageProgress * 40);
      depthFill.style.height = pageProgress * 100 + "%";
      depthReadout.style.top = pageProgress * 100 + "%";
      depthReadout.textContent = depth + "m";
    }

    if (!reduceMotion && diveProfileEl) {
      var progress = hoverStepIndex !== null
        ? stepThresholds[hoverStepIndex] + 0.001
        : scrollProgress(diveProfileEl);

      if (divePath && pathLength) {
        divePath.style.strokeDashoffset = pathLength * (1 - progress);
      }

      diveMarkers.forEach(function (marker) {
        var threshold = parseFloat(marker.getAttribute("data-progress"));
        marker.classList.toggle("is-active", progress >= threshold);
      });

      diveSteps.forEach(function (step) {
        var index = parseInt(step.getAttribute("data-step"), 10);
        step.classList.toggle("is-active", progress >= stepThresholds[index]);
        step.classList.toggle("is-hovered", index === hoverStepIndex);
      });
    }
  }

  /* Hovering a step "seeks" the dive profile to that point instead of only
     reacting to scroll — draws the path through that step and releases back
     to the real scroll position on mouseleave. */
  if (!reduceMotion && diveProfileEl && diveSteps.length) {
    diveSteps.forEach(function (step) {
      var index = parseInt(step.getAttribute("data-step"), 10);

      step.addEventListener("mouseenter", function () {
        hoverStepIndex = index;
        if (divePath) divePath.classList.add("is-seeking");
        clearTimeout(seekTimeout);
        updateScrollEffects();
      });

      step.addEventListener("mouseleave", function () {
        hoverStepIndex = null;
        updateScrollEffects();
        clearTimeout(seekTimeout);
        seekTimeout = setTimeout(function () {
          if (divePath) divePath.classList.remove("is-seeking");
        }, 550);
      });
    });
  }

  function onScroll() {
    updateHeader();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrollEffects);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () {
    if (divePath && !reduceMotion) {
      try {
        pathLength = divePath.getTotalLength();
      } catch (e) {
        pathLength = 0;
      }
    }
    updateScrollEffects();
  });

  updateHeader();
  updateScrollEffects();

  /* ---------- Magnetic buttons + bubble burst ---------- */

  if (!reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (button) {
      button.addEventListener("mousemove", function (e) {
        var rect = button.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        var y = (e.clientY - rect.top - rect.height / 2) * 0.35;
        button.style.transform = "translate(" + x + "px, " + y + "px)";
      });

      button.addEventListener("mouseleave", function () {
        button.style.transform = "";
      });

      button.addEventListener("mouseenter", function () {
        for (var i = 0; i < 3; i++) {
          (function (i) {
            setTimeout(function () {
              var bubble = document.createElement("span");
              bubble.className = "button__bubble";
              bubble.style.left = 14 + Math.random() * 70 + "%";
              bubble.setAttribute("aria-hidden", "true");
              button.appendChild(bubble);
              setTimeout(function () {
                bubble.remove();
              }, 950);
            }, i * 110);
          })(i);
        }
      });
    });
  }
})();
