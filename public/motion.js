// small motion effects; every one is skipped when the visitor asks for reduced motion
(function () {
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // the supporting line lights up word by word, as if read aloud, then rests as plain text and
  // reads again every 10 seconds. Moving content that repeats must be pausable (WCAG 2.2.2), so a
  // pause button sits beside it. Nothing runs while the tab is hidden
  var line = document.querySelector("[data-read]");
  if (line) {
    var words = line.querySelectorAll(".w"), i = 0, timer, paused = false;
    var clear = function () {
      line.classList.remove("reading");
      words.forEach(function (w) { w.classList.remove("now", "done"); });
    };
    var step = function () {
      if (paused) return;
      if (i) words[i - 1].classList.replace("now", "done");
      if (i === words.length) { line.classList.remove("reading"); timer = setTimeout(read, 10000); return; }
      words[i++].classList.add("now");
      timer = setTimeout(step, 420);
    };
    var read = function () {
      if (paused || document.hidden) { timer = setTimeout(read, 10000); return; }
      clear(); i = 0; line.classList.add("reading"); step();
    };
    var button = document.createElement("button");
    button.type = "button";
    button.className = "read-toggle";
    button.setAttribute("aria-pressed", "false");
    button.textContent = "Pause";
    button.setAttribute("aria-label", "Pause the highlight animation");
    button.addEventListener("click", function () {
      paused = !paused;
      clearTimeout(timer);
      button.setAttribute("aria-pressed", String(paused));
      button.textContent = paused ? "Play" : "Pause";
      button.setAttribute("aria-label", paused ? "Play the highlight animation" : "Pause the highlight animation");
      if (paused) clear(); else timer = setTimeout(read, 300);
    });
    line.appendChild(document.createTextNode(" "));
    line.appendChild(button);
    timer = setTimeout(read, 300);
  }

  // headings and cards below the fold fade and rise once as they come into view; anything already
  // on screen is left alone so nothing visible ever disappears
  if (!("IntersectionObserver" in window)) return;
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -40px 0px" });
  var items = document.querySelectorAll("main h2, .features > li, .roadmap > li, .contact-list > li, .pipeline > li, .faq details");
  items.forEach(function (el) {
    if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("rise"); seen.observe(el); }
  });
})();
