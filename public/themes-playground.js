// the code themes playground: every theme and language is already rendered in the page, so the two
// selects only choose which block is shown. Without this script the page shows Zacess Light with
// TypeScript and the eight theme grid. The selects stay hidden
(function () {
  var themeSelect = document.getElementById("pg-theme");
  var langSelect = document.getElementById("pg-lang");
  var preview = document.getElementById("pg-preview");
  if (!themeSelect || !langSelect || !preview) return;
  var title = document.getElementById("pg-title");
  var status = document.getElementById("pg-status");
  var copy = document.getElementById("pg-copy");
  var copied = document.getElementById("pg-copied");
  var KEY = "zacess-code-theme";
  var themes = [].map.call(themeSelect.options, function (o) { return o.value; });
  var langs = [].map.call(langSelect.options, function (o) { return o.value; });

  function nameOf(select, value) {
    for (var i = 0; i < select.options.length; i++) if (select.options[i].value === value) return select.options[i].textContent;
    return value;
  }

  // the hash is theme then language. Theme ids contain hyphens, so the language is after the last one
  function parse(text) {
    var cut = text.lastIndexOf("-");
    if (cut < 1) return null;
    var theme = text.slice(0, cut);
    var lang = text.slice(cut + 1);
    return themes.indexOf(theme) >= 0 && langs.indexOf(lang) >= 0 ? { theme: theme, lang: lang } : null;
  }

  function show(theme, lang, announce) {
    var source = document.querySelector('.theme-grid[data-lang="' + lang + '"] [data-theme="' + theme + '"] pre');
    if (!source) return;
    var old = preview.querySelector("pre");
    var block = source.cloneNode(true);
    if (old) old.replaceWith(block); else preview.appendChild(block);
    preview.className = "frame frame-" + theme + " frame-large";
    var label = nameOf(themeSelect, theme) + ", " + nameOf(langSelect, lang);
    if (title) title.textContent = label;
    themeSelect.value = theme;
    langSelect.value = lang;
    [].forEach.call(document.querySelectorAll(".pg-info"), function (dl) { dl.hidden = dl.getAttribute("data-theme") !== theme; });
    [].forEach.call(document.querySelectorAll(".theme-grid"), function (g) { g.hidden = g.getAttribute("data-lang") !== lang; });
    if (announce && status) status.textContent = label;
    if (copied) copied.textContent = "";
    try { localStorage.setItem(KEY, theme + "-" + lang); } catch (e) { /* storage can be blocked; the page works without it */ }
    if (history.replaceState) history.replaceState(null, "", "#" + theme + "-" + lang);
  }

  var start = parse(location.hash.slice(1));
  if (!start) {
    try { start = parse(localStorage.getItem(KEY) || ""); } catch (e) { start = null; }
  }
  start = start || { theme: "light", lang: "typescript" };
  show(start.theme, start.lang, false);

  function changed() { show(themeSelect.value, langSelect.value, true); }
  themeSelect.addEventListener("change", changed);
  langSelect.addEventListener("change", changed);
  window.addEventListener("hashchange", function () {
    var next = parse(location.hash.slice(1));
    if (next) show(next.theme, next.lang, true);
  });

  if (copy) {
    copy.addEventListener("click", function () {
      var code = preview.querySelector("pre");
      var text = code ? code.textContent : "";
      var done = function () { if (copied) copied.textContent = "Copied"; };
      var failed = function () { if (copied) copied.textContent = "Copying is blocked here. Select the code to copy it."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, failed);
      else failed();
    });
  }
})();
