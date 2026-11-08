// the code themes playground: the studio above (src/components/Studio.astro) chooses the theme and
// the language. This script follows it: it shows the chosen theme's contrast figures, shows the side
// by side grid for the chosen language and copies the sample on screen. Without this script the page
// shows Zacess Light with TypeScript, Light's figures and the TypeScript grid
(function () {
  var studio = document.getElementById("themes-studio");
  if (!studio) return;
  var copy = document.getElementById("pg-copy");
  var copied = document.getElementById("pg-copied");

  function follow(theme, lang) {
    if (!theme || !lang) return;
    [].forEach.call(document.querySelectorAll(".pg-info"), function (dl) { dl.hidden = dl.getAttribute("data-theme") !== theme; });
    [].forEach.call(document.querySelectorAll(".theme-grid"), function (g) { g.hidden = g.getAttribute("data-lang") !== lang; });
    if (copied) copied.textContent = "";
  }
  studio.addEventListener("studio:change", function (e) { follow(e.detail.theme, e.detail.item); });
  // the studio has drawn its first choice before this script runs, so it is read from the controls
  var theme = studio.querySelector('select[data-st="theme"]');
  var lang = studio.querySelector('select[data-st="item"]');
  if (theme && lang) follow(theme.value, lang.value);

  if (copy) {
    copy.addEventListener("click", function () {
      var code = studio.querySelector(".st-code pre");
      var text = code ? code.textContent : "";
      var done = function () { if (copied) copied.textContent = "Copied"; };
      var failed = function () { if (copied) copied.textContent = "Copying is blocked here. Select the code to copy it."; };
      if (text && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, failed);
      else failed();
    });
  }
})();
