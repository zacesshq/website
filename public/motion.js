// small motion effects; every one is skipped when the visitor asks for reduced motion
(function () {
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // the supporting line lights up word by word, as if read aloud, then rests as plain text
  var line = document.querySelector("[data-read]");
  if (line) {
    var words = line.querySelectorAll(".w"), i = 0;
    line.classList.add("reading");
    var step = function () {
      if (i) words[i - 1].classList.replace("now", "done");
      if (i === words.length) return line.classList.remove("reading");
      words[i++].classList.add("now");
      setTimeout(step, 420);
    };
    setTimeout(step, 300);
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
